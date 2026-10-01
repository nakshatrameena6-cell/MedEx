import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ForbiddenError, InvalidTransitionError, NotFoundError
from app.core.roles import UserContext, UserRole
from app.db.models import FederationRoundRecord
from app.fixtures.mock_data import MOCK_FEDERATION_ROUNDS
from app.schemas.federation import (
    FederationRoundItem, FederationRoundRequest, FederationRoundsResponse, LocalUpdateSubmissionRequest
)
from app.services.audit import audit_service


class FederationService:
    def __init__(self, db: Session):
        self.db = db

    def trigger_round(self, body: FederationRoundRequest, ctx: UserContext) -> FederationRoundItem:
        # RBAC Check: Only STATE role can trigger federation rounds
        if ctx.role != UserRole.STATE:
            raise ForbiddenError(message="Only STATE role is authorized to trigger federated learning rounds")

        # Determine round number & ID
        existing_rounds = self.db.query(FederationRoundRecord).order_by(FederationRoundRecord.round_number.desc()).all()
        max_num = max([r.round_number for r in existing_rounds], default=1)
        r_num = body.round_number if (body.round_number and body.round_number > max_num) else (max_num + 1)
        
        r_id = f"FED-R{r_num:02d}"
        existing_rec = self.db.query(FederationRoundRecord).filter(FederationRoundRecord.round_id == r_id).first()
        if existing_rec:
            r_num = max_num + 1
            r_id = f"FED-R{r_num:02d}"
        
        nodes_count = body.participating_nodes or 15
        agg_method = body.aggregation_method or "FedAvg"
        
        prev_version = existing_rounds[0].model_version if existing_rounds else "v1.1.0"
        major, minor, patch = 1, r_num, 0
        new_version = f"v{major}.{minor}.{patch}"

        # Calculate accuracy & loss deterministically based on round number
        accuracy = round(min(0.90 + (r_num * 0.015), 0.98), 2)
        loss = round(max(0.20 - (r_num * 0.02), 0.05), 2)

        now = datetime.datetime.utcnow()
        completed_time = now

        # Create DB record
        fed_rec = FederationRoundRecord(
            round_id=r_id,
            round_number=r_num,
            participating_nodes=nodes_count,
            status="COMPLETED",
            accuracy=accuracy,
            loss=loss,
            model_version=new_version,
            previous_model_version=prev_version,
            aggregation_method=agg_method,
            metrics={
                "mode": "simulated",
                "participating_states": body.state_codes or ["TN", "BR", "MH"],
                "aggregation": agg_method,
                "accuracy": accuracy,
                "loss": loss
            },
            created_at=now,
            completed_at=completed_time,
            created_by=ctx.user_id
        )
        self.db.add(fed_rec)
        self.db.commit()

        # Audit Event creation
        audit_service.record(
            ctx,
            "TRIGGER_FEDERATION_ROUND",
            "FEDERATION",
            resource_id=r_id,
            details={
                "round_number": r_num,
                "model_version": new_version,
                "nodes": nodes_count,
                "accuracy": accuracy,
                "mode": "simulated"
            },
            db=self.db
        )

        return FederationRoundItem(
            round_id=r_id,
            round_number=r_num,
            participating_nodes=nodes_count,
            status="COMPLETED",
            accuracy=accuracy,
            loss=loss,
            model_version=new_version,
            aggregation_method=agg_method,
            mode="simulated",
            timestamp=now.isoformat() + "Z",
            completed_at=completed_time.isoformat() + "Z",
            metrics={"mode": "simulated", "participating_states": body.state_codes or ["TN", "BR", "MH"], "accuracy": accuracy, "loss": loss}
        )


    def get_rounds(self, ctx: UserContext) -> FederationRoundsResponse:
        # RBAC Check: STATE, AUDITOR, DISTRICT allowed
        if ctx.role in (UserRole.FACILITY, UserRole.BLOCK):
            raise ForbiddenError(message="Role not authorized to view federation history")

        db_rounds = self.db.query(FederationRoundRecord).order_by(FederationRoundRecord.round_number.desc()).all()
        
        if not db_rounds:
            # Fallback to mock fixtures if DB empty
            items = [FederationRoundItem(**r) for r in MOCK_FEDERATION_ROUNDS]
            return FederationRoundsResponse(rounds=items)

        items: List[FederationRoundItem] = []
        for r in db_rounds:
            ts = r.created_at.isoformat() + "Z" if r.created_at else "2026-09-29T10:45:00Z"
            c_ts = r.completed_at.isoformat() + "Z" if r.completed_at else ts

            items.append(
                FederationRoundItem(
                    round_id=r.round_id,
                    round_number=r.round_number,
                    participating_nodes=r.participating_nodes or 12,
                    status=r.status or "COMPLETED",
                    accuracy=r.accuracy or 0.94,
                    loss=r.loss or 0.12,
                    model_version=r.model_version or "v1.1.0",
                    aggregation_method=r.aggregation_method or "FedAvg",
                    timestamp=ts,
                    completed_at=c_ts,
                    metrics=r.metrics or {}
                )
            )
        return FederationRoundsResponse(rounds=items)

    def submit_local_update(self, round_id: str, body: LocalUpdateSubmissionRequest, ctx: UserContext) -> FederationRoundItem:
        r = self.db.query(FederationRoundRecord).filter(FederationRoundRecord.round_id == round_id).first()
        if not r:
            raise NotFoundError(message=f"Federation round {round_id} not found")

        # Lifecycle check: cannot submit updates to COMPLETED rounds
        if r.status == "COMPLETED":
            raise InvalidTransitionError(
                message=f"Cannot submit model update to completed federation round {round_id}",
                details={"state": r.status}
            )

        r.participating_nodes += 1
        self.db.commit()

        # Audit Event creation
        audit_service.record(
            ctx,
            "FEDERATION_UPDATE_SUBMITTED",
            "FEDERATION",
            resource_id=round_id,
            details={"node_id": body.node_id, "local_samples": body.local_samples},
            db=self.db
        )

        ts = r.created_at.isoformat() + "Z" if r.created_at else "2026-09-29T10:45:00Z"
        return FederationRoundItem(
            round_id=r.round_id,
            round_number=r.round_number,
            participating_nodes=r.participating_nodes,
            status=r.status,
            accuracy=r.accuracy,
            loss=r.loss,
            model_version=r.model_version,
            aggregation_method=r.aggregation_method,
            timestamp=ts,
            metrics=r.metrics or {}
        )
