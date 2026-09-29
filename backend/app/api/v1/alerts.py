from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.fixtures.mock_data import MOCK_ALERTS
from app.schemas.alerts import AlertItem, AlertsResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=AlertsResponse, summary="Get Supply Chain Alerts")
def get_alerts(ctx: UserContext = Depends(get_current_user_context)):
    check_read_access(ctx)
    return AlertsResponse(alerts=[AlertItem(**a) for a in MOCK_ALERTS])
