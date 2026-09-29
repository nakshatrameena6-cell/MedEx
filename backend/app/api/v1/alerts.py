from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.fixtures.mock_data import MOCK_ALERTS, MOCK_ALERT_AUDIO
from app.schemas.alerts import AlertItem, AlertsResponse, AlertAudioResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=AlertsResponse, summary="Get Supply Chain Alerts")
def get_alerts(ctx: UserContext = Depends(get_current_user_context)):
    check_read_access(ctx)
    return AlertsResponse(alerts=[AlertItem(**a) for a in MOCK_ALERTS])


@router.get("/{alert_id}/audio", response_model=AlertAudioResponse, summary="Get Alert Audio Snippet")
def get_alert_audio(
    alert_id: str,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_read_access(ctx)
    res = dict(MOCK_ALERT_AUDIO)
    res["alert_id"] = alert_id
    return AlertAudioResponse(**res)

