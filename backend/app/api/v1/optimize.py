from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_optimize_access
from app.fixtures.mock_data import MOCK_OPTIMIZATION
from app.schemas.optimize import OptimizeRequest, OptimizeResponse
from app.services.audit import audit_service

router = APIRouter(prefix="/optimize", tags=["Optimize"])


@router.post("", response_model=OptimizeResponse, summary="Trigger Redistribution Optimization")
def run_optimization(
    body: OptimizeRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_optimize_access(ctx)
    audit_service.record(ctx, "OPTIMIZE_REDISTRIBUTION", "district", body.district_id or ctx.district)
    return OptimizeResponse(**MOCK_OPTIMIZATION)
