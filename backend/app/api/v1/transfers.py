from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access, check_transfer_decision_access
from app.fixtures.mock_data import MOCK_TRANSFERS
from app.schemas.transfers import (
    TransferItem, TransferDecisionRequest, TransferDecisionResponse
)
from app.services.audit import audit_service

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.get("", response_model=List[TransferItem], summary="Get Redistribution Transfers")
def get_transfers(ctx: UserContext = Depends(get_current_user_context)):
    check_read_access(ctx)
    return [TransferItem(**t) for t in MOCK_TRANSFERS]


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
