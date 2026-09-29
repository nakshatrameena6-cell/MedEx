from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.db.database import get_db
from app.db.repositories import AlertRepository
from app.fixtures.mock_data import MOCK_ALERTS, MOCK_ALERT_AUDIO
from app.schemas.alerts import AlertItem, AlertsResponse, AlertAudioResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=AlertsResponse, summary="Get Supply Chain Alerts")
def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)
    repo = AlertRepository(db)
    alerts = repo.get_scoped_alerts(ctx, skip=skip, limit=limit)
    if not alerts:
        return AlertsResponse(alerts=[AlertItem(**a) for a in MOCK_ALERTS])

    items = [
        AlertItem(
            alert_id=a.alert_id,
            facility_id=a.facility_id,
            severity=a.severity,
            message=a.message,
            timestamp=a.created_at.isoformat() + "Z" if a.created_at else "2026-09-29T08:30:00Z"
        )
        for a in alerts
    ]
    return AlertsResponse(alerts=items)


@router.get("/{alert_id}/audio", response_model=AlertAudioResponse, summary="Get Alert Audio Snippet")
def get_alert_audio(
    alert_id: str,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_read_access(ctx)
    res = dict(MOCK_ALERT_AUDIO)
    res["alert_id"] = alert_id
    return AlertAudioResponse(**res)
