from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.fixtures.mock_data import MOCK_FORECAST
from app.schemas.forecast import ForecastItem

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("", response_model=List[ForecastItem], summary="Get Stock Demand Forecast")
def get_forecast(ctx: UserContext = Depends(get_current_user_context)):
    check_read_access(ctx)
    return [ForecastItem(**item) for item in MOCK_FORECAST]
