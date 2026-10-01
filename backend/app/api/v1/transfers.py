from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.config import settings
from app.core.roles import UserContext
from app.core.security import check_read_access, check_transfer_decision_access
from app.db.database import get_db
from app.fixtures.mock_data import MOCK_TRANSFERS
from app.schemas.transfers import (
    TransferDecisionRequest, TransferDecisionResponse, TransferItem, TransfersResponse
)
from app.services.transfers import TransferService

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.get("", response_model=TransfersResponse, summary="Get Redistribution Transfers")
def get_transfers(
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    state: Optional[str] = Query(None, description="Filter by transfer state (OPEN, APPROVED, REJECTED, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)
    service = TransferService(db)
    items = service.get_scoped_transfers(ctx, skip=skip, limit=limit, state_filter=state)
    if not items and settings.MOCK_MODE and not state:
        items = [TransferItem(**t) for t in MOCK_TRANSFERS]
    return TransfersResponse(items=items, transfers=items)


@router.post("/{transfer_id}/decision", response_model=TransferDecisionResponse, summary="Approve/Modify/Reject/Escalate/Close Transfer Decision")
def transfer_decision(
    transfer_id: str,
    body: TransferDecisionRequest,
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_transfer_decision_access(ctx)
    service = TransferService(db)
    return service.execute_decision(transfer_id, body, ctx)

