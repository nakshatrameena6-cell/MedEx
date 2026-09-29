from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.fixtures.mock_data import MOCK_RISK
from app.schemas.risk import RiskItem

router = APIRouter(prefix="/risk", tags=["Risk"])


@router.get("", response_model=List[RiskItem], summary="Get Shortage & Risk Assessment")
def get_risk(ctx: UserContext = Depends(get_current_user_context)):
    check_read_access(ctx)
    return [RiskItem(**r) for r in MOCK_RISK]
