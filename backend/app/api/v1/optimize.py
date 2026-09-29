from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.config import settings
from app.core.roles import UserContext
from app.core.security import check_optimize_access
from app.db.database import get_db
from app.schemas.optimize import OptimizeRequest, OptimizeResponse
from app.services.optimizer import RedistributionOptimizer

router = APIRouter(prefix="/optimize", tags=["Optimize"])


@router.post("", response_model=OptimizeResponse, summary="Trigger Redistribution Optimization")
def run_optimization(
    body: OptimizeRequest,
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_optimize_access(ctx)
    optimizer = RedistributionOptimizer(db)
    return optimizer.optimize(body, ctx)

