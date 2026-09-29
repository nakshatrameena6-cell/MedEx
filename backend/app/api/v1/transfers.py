from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access, check_transfer_decision_access
from app.db.database import get_db
from app.db.repositories import TransferRepository
from app.fixtures.mock_data import MOCK_TRANSFERS
from app.schemas.transfers import (
    TransferItem, TransferDecisionRequest, TransferDecisionResponse
)
from app.services.audit import audit_service

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.get("", response_model=List[TransferItem], summary="Get Redistribution Transfers")
def get_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)
    repo = TransferRepository(db)
    transfers = repo.get_scoped_transfers(ctx, skip=skip, limit=limit)
    if not transfers:
        return [TransferItem(**t) for t in MOCK_TRANSFERS]

    return [
        TransferItem(
            transfer_id=t.transfer_id,
            source_facility_id=t.source_facility_id,
            destination_facility_id=t.destination_facility_id,
            drug_id=t.drug_code,
            quantity=t.quantity,
            status=t.status,
            created_at=t.created_at.isoformat() + "Z" if t.created_at else "2026-09-29T09:00:00Z"
        )
        for t in transfers
    ]


@router.post("/{transfer_id}/decision", response_model=TransferDecisionResponse, summary="Approve/Reject Transfer Decision")
def transfer_decision(
    transfer_id: str,
    body: TransferDecisionRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_transfer_decision_access(ctx)
    audit_service.record(
        ctx,
        f"TRANSFER_DECISION_{body.action.upper()}",
        "transfer",
        transfer_id,
        details={"notes": body.notes}
    )
    return TransferDecisionResponse(
        transfer_id=transfer_id,
        status="APPROVED" if body.action.upper() == "APPROVE" else "REJECTED",
        decided_by=ctx.user_id,
        timestamp="2026-09-29T10:30:00Z"
    )
