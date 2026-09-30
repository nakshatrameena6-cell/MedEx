import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.errors import (
    AppException, ConstraintViolationError, ForbiddenError, InvalidTransitionError, NotFoundError, ValidationError
)
from app.core.roles import UserContext, UserRole
from app.db.models import Facility, IssuesReceipts, StockSnapshot, Transfer
from app.db.repositories import FacilityRepository, StockSnapshotRepository, TransferRepository
from app.schemas.transfers import TransferDecisionRequest, TransferDecisionResponse, TransferItem
from app.services.audit import audit_service
from app.services.forecast import ForecastService


class TransferService:
    def __init__(self, db: Session):
        self.db = db
        self.transfer_repo = TransferRepository(db)
        self.facility_repo = FacilityRepository(db)
        self.stock_repo = StockSnapshotRepository(db)
        self.forecast_service = ForecastService(db)

    def get_scoped_transfers(self, ctx: UserContext, skip: int = 0, limit: int = 100, state_filter: Optional[str] = None) -> List[TransferItem]:
        transfers = self.transfer_repo.get_scoped_transfers(ctx, skip=0, limit=1000)
        
        if state_filter:
            target_state = state_filter.upper()
            transfers = [t for t in transfers if t.status == target_state]

        transfers = transfers[skip:skip + limit]
        
        res: List[TransferItem] = []
        for t in transfers:
            created_str = t.created_at.isoformat() + "Z" if t.created_at else "2026-09-29T09:00:00Z"
            updated_str = t.updated_at.isoformat() + "Z" if t.updated_at else None
            expiry_str = t.batch_expiry_date.isoformat() if t.batch_expiry_date else None
            
            res.append(
                TransferItem(
                    transfer_id=t.transfer_id,
                    run_id=t.run_id,
                    rank=t.rank or 1,
                    source_facility_id=t.source_facility_id,
                    destination_facility_id=t.destination_facility_id,
                    drug_id=t.drug_code,
                    drug_code=t.drug_code,
                    drug_name=t.drug_name or t.drug_code,
                    unit=t.unit or "unit",
                    quantity=t.quantity,
                    qty=t.quantity,
                    status=t.status,
                    state=t.status,
                    eta_hours=t.eta_hours or 1.5,
                    distance_km=t.distance_km or 25.0,
                    cost_inr=t.cost_inr or t.cost or 500.0,
                    batch_expiry_date=expiry_str,
                    expiry_ok=t.expiry_ok if t.expiry_ok is not None else True,
                    cross_state=t.cross_state if t.cross_state is not None else False,
                    route=t.route or {"polyline": "w~abA~_seM_@aA", "duration_min": 45},
                    reason=t.reason,
                    created_at=created_str,
                    updated_at=updated_str,
                    decided_by=t.decided_by or t.approved_by,
                    decision_comment=t.decision_comment
                )
            )
        return res

    def execute_decision(self, transfer_id: str, body: TransferDecisionRequest, ctx: UserContext) -> TransferDecisionResponse:
        # RBAC Check: FACILITY and AUDITOR cannot make transfer decisions
        if ctx.role in (UserRole.FACILITY, UserRole.AUDITOR):
            raise ForbiddenError(message="Role not authorized to make transfer decisions")

        transfer = self.db.query(Transfer).filter(Transfer.transfer_id == transfer_id).first()
        if not transfer:
            raise NotFoundError(message=f"Transfer {transfer_id} not found")

        # Scope Check: User must have scope over source or destination facility
        d_fac = self.facility_repo.get_by_id(transfer.source_facility_id)
        r_fac = self.facility_repo.get_by_id(transfer.destination_facility_id)

        if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT):
            if ctx.district and ctx.district != "ALL":
                d_in_scope = (d_fac and d_fac.district_id == ctx.district)
                r_in_scope = (r_fac and r_fac.district_id == ctx.district)
                if not (d_in_scope or r_in_scope):
                    raise ForbiddenError(message=f"Transfer {transfer_id} is outside authorized district scope {ctx.district}")

        action = body.action.upper()
        current_status = transfer.status.upper()
        notes = body.notes or body.decision_comment

        # State transition validation
        if action == "APPROVE":
            if current_status not in ("OPEN", "UNDER_REVIEW", "ESCALATED"):
                raise InvalidTransitionError(
                    message=f"Cannot APPROVE transfer in state {current_status}",
                    details={"state": current_status}
                )
            transfer.status = "APPROVED"
            transfer.decided_by = ctx.user_id
            transfer.approved_by = ctx.user_id
            transfer.decision_comment = notes
            transfer.updated_at = datetime.datetime.utcnow()
            audit_action = "TRANSFER_APPROVE"

        elif action == "MODIFY":
            if current_status not in ("OPEN", "UNDER_REVIEW"):
                raise InvalidTransitionError(
                    message=f"Cannot MODIFY transfer in state {current_status}",
                    details={"state": current_status}
                )
            
            new_qty = body.modified_qty if body.modified_qty is not None else transfer.quantity
            new_source_id = body.modified_source_facility_id if body.modified_source_facility_id else transfer.source_facility_id
            new_dest_id = body.modified_destination_facility_id if body.modified_destination_facility_id else transfer.destination_facility_id

            if body.modified_qty is None and not body.modified_source_facility_id and not body.modified_destination_facility_id:
                raise ValidationError(message="MODIFY action requires at least modified_qty or modified_source_facility_id")

            # Revalidate constraints
            if new_qty < 1:
                raise ConstraintViolationError(message="Modified quantity must be >= 1")

            # Vehicle capacity check
            if new_qty > 500:
                raise ConstraintViolationError(message="Modified quantity exceeds max vehicle capacity (500 units)")

            # Check donor facility exists
            new_d_fac = self.facility_repo.get_by_id(new_source_id)
            if not new_d_fac or not new_d_fac.is_active:
                raise ConstraintViolationError(message=f"Modified donor facility {new_source_id} is invalid or inactive")

            # Scope check on modified donor
            if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT) and ctx.district and ctx.district != "ALL":
                if new_d_fac.district_id != ctx.district:
                    raise ConstraintViolationError(message=f"Modified source facility {new_source_id} is outside authorized district scope {ctx.district}")

            # Check donor 14-day cover constraint
            snapshots = self.stock_repo.get_latest_stock_for_facility(new_source_id)
            sn = next((s for s in snapshots if s.drug_code == transfer.drug_code), None)
            usable_stock = sn.usable_quantity if sn else 0
            
            demand_res = self.forecast_service.generate_forecast(new_source_id, drug_code=transfer.drug_code, horizon_days=28)
            daily_demand = max(float(demand_res.get("predicted_demand", 280)) / 28.0, 1.0)

            cover_after = (usable_stock - new_qty) / daily_demand
            if cover_after < 14.0:
                raise ConstraintViolationError(
                    message=f"Donor {new_source_id} cover after transfer ({cover_after:.1f} days) violates minimum safety margin (14 days)",
                    details={"cover_after": cover_after, "min_required": 14.0}
                )

            # Batch expiry check
            if transfer.expiry_ok is False:
                raise ConstraintViolationError(message="Cannot approve modified transfer with invalid/expired batch")

            transfer.quantity = new_qty
            transfer.source_facility_id = new_source_id
            transfer.destination_facility_id = new_dest_id
            transfer.status = "APPROVED"
            transfer.decided_by = ctx.user_id
            transfer.approved_by = ctx.user_id
            transfer.decision_comment = notes
            transfer.updated_at = datetime.datetime.utcnow()
            audit_action = "TRANSFER_MODIFY"

        elif action == "REJECT":
            if current_status not in ("OPEN", "UNDER_REVIEW", "ESCALATED"):
                raise InvalidTransitionError(
                    message=f"Cannot REJECT transfer in state {current_status}",
                    details={"state": current_status}
                )
            if not notes or not notes.strip():
                raise ValidationError(message="Rejection reason comment is mandatory when rejecting a transfer")

            transfer.status = "REJECTED"
            transfer.decided_by = ctx.user_id
            transfer.decision_comment = notes.strip()
            transfer.updated_at = datetime.datetime.utcnow()
            audit_action = "TRANSFER_REJECT"

        elif action == "ESCALATE":
            if current_status not in ("OPEN", "UNDER_REVIEW"):
                raise InvalidTransitionError(
                    message=f"Cannot ESCALATE transfer in state {current_status}",
                    details={"state": current_status}
                )
            transfer.status = "ESCALATED"
            transfer.decided_by = ctx.user_id
            transfer.decision_comment = notes
            transfer.updated_at = datetime.datetime.utcnow()
            audit_action = "TRANSFER_ESCALATE"

        elif action == "MARK_DONE":
            if current_status not in ("APPROVED", "IN_TRANSIT"):
                raise InvalidTransitionError(
                    message=f"Cannot MARK_DONE transfer in state {current_status}",
                    details={"state": current_status}
                )
            
            # Atomically update Inventory Ledger
            today_date = datetime.date.today()
            qty = transfer.quantity
            drug_code = transfer.drug_code

            # 1. Update donor stock snapshot (deduct usable quantity)
            d_sn = (
                self.db.query(StockSnapshot)
                .filter(StockSnapshot.facility_id == transfer.source_facility_id, StockSnapshot.drug_code == drug_code)
                .order_by(StockSnapshot.snapshot_date.desc())
                .first()
            )
            if d_sn:
                d_sn.usable_quantity = max(0, d_sn.usable_quantity - qty)
                d_sn.quantity = max(0, d_sn.quantity - qty)

            # 2. Update recipient stock snapshot (add usable quantity)
            r_sn = (
                self.db.query(StockSnapshot)
                .filter(StockSnapshot.facility_id == transfer.destination_facility_id, StockSnapshot.drug_code == drug_code)
                .order_by(StockSnapshot.snapshot_date.desc())
                .first()
            )
            if r_sn:
                r_sn.usable_quantity += qty
                r_sn.quantity += qty
            else:
                new_r_sn = StockSnapshot(
                    facility_id=transfer.destination_facility_id,
                    drug_code=drug_code,
                    snapshot_date=today_date,
                    quantity=qty,
                    usable_quantity=qty,
                    reported_at=datetime.datetime.utcnow(),
                    source="REDISTRIBUTION_TRANSFER"
                )
                self.db.add(new_r_sn)

            # 3. Create IssuesReceipts transactions
            issue_rec = IssuesReceipts(
                facility_id=transfer.source_facility_id,
                drug_code=drug_code,
                date=today_date,
                quantity=qty,
                transaction_type="ISSUE"
            )
            receipt_rec = IssuesReceipts(
                facility_id=transfer.destination_facility_id,
                drug_code=drug_code,
                date=today_date,
                quantity=qty,
                transaction_type="RECEIPT"
            )
            self.db.add(issue_rec)
            self.db.add(receipt_rec)

            transfer.status = "CLOSED"
            transfer.decided_by = ctx.user_id
            transfer.updated_at = datetime.datetime.utcnow()
            audit_action = "TRANSFER_DONE"

        else:
            raise ValidationError(message=f"Unknown action {action}")

        self.db.commit()

        # Audit Event creation
        audit_service.record(
            ctx,
            audit_action,
            "TRANSFER",
            transfer_id,
            details={
                "district": ctx.district,
                "action": action,
                "previous_state": current_status,
                "new_state": transfer.status,
                "notes": notes
            },
            db=self.db
        )

        return TransferDecisionResponse(
            transfer_id=transfer_id,
            status=transfer.status,
            decided_by=ctx.user_id,
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            details={
                "action": action,
                "previous_state": current_status,
                "new_state": transfer.status,
                "notes": notes
            }
        )
