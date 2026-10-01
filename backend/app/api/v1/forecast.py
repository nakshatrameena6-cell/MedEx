from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.config import settings
from app.core.errors import NotFoundError
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.db.database import get_db
from app.db.repositories import FacilityRepository, DrugMasterRepository
from app.schemas.forecast import (
    ForecastDriver, ForecastHistoryPoint, ForecastPoint, ForecastResponse
)
from app.services.forecast import ForecastService

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("", response_model=ForecastResponse, summary="Get Stock Demand Forecast")
def get_forecast(
    facility_id: Optional[str] = Query(None, description="Filter by facility ID"),
    drug_id: Optional[str] = Query(None, description="Filter by drug code e.g. ORS"),
    drug_code: Optional[str] = Query(None, description="Filter by drug code e.g. ORS"),
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    horizon_days: int = Query(30, ge=1, le=180, description="Forecast horizon in days"),
    horizon_weeks: Optional[int] = Query(None, description="Forecast horizon in weeks"),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)

    effective_fac_id = facility_id
    effective_drug_code = (drug_id or drug_code or "").upper()
    target_district_id = ctx.district if ctx.district != "ALL" else district_id

    facility_repo = FacilityRepository(db)
    facilities = facility_repo.filter_facilities(
        ctx=ctx,
        district_id=target_district_id
    )

    if effective_fac_id:
        scoped = [f for f in facilities if f.facility_id == effective_fac_id]
        if not scoped:
            raise NotFoundError(message=f"Forecast for facility '{effective_fac_id}' not found in authorized scope.")
        target_facility = scoped[0]
    else:
        if not facilities:
            raise NotFoundError(message="No facilities found in authorized scope.")
        target_facility = facilities[0]

    target_fac_id = target_facility.facility_id
    target_drug_code = effective_drug_code or "ORS"

    if horizon_weeks:
        h_days = horizon_weeks * 7
    else:
        h_days = horizon_days

    service = ForecastService(db)
    item = service.compute_forecast_for_facility_drug(target_fac_id, target_drug_code, horizon_days=h_days)

    today = date.today()
    history_pts = [
        ForecastHistoryPoint(
            date=(today - timedelta(days=28 - i)).isoformat(),
            qty=float(item.historical_actual_28d[i]) if i < len(item.historical_actual_28d) else 20.0
        )
        for i in range(28)
    ]

    points_pts = [
        ForecastPoint(
            date=dp.date,
            p10=float(dp.p10),
            p50=float(dp.p50),
            p90=float(dp.p90)
        )
        for dp in item.daily_forecast
    ]

    unit_name = "sachets" if target_drug_code == "ORS" else ("tablets" if "PARA" in target_drug_code else "vials")

    drivers_list = [
        ForecastDriver(name="historical_consumption_baseline", direction="up", contribution_pct=45.0),
        ForecastDriver(name="opd_footfall_correlation", direction="up", contribution_pct=35.0),
        ForecastDriver(name="monsoon_seasonal_factor", direction="up", contribution_pct=20.0)
    ]

    return ForecastResponse(
        facility_id=target_fac_id,
        drug_code=target_drug_code,
        drug_id=target_drug_code,
        unit=unit_name,
        horizon_weeks=max(1, h_days // 7),
        horizon_days=h_days,
        model_version="v1.1.0-simulated",
        model_scope="federated",
        generated_at=datetime.now(timezone.utc).isoformat(),
        history=history_pts,
        points=points_pts,
        daily_forecast=points_pts,
        drivers=drivers_list,
        predicted_demand=item.predicted_demand,
        confidence=item.confidence,
        forecast_date=item.forecast_date,
        p10=item.p10,
        p50=item.p50,
        p90=item.p90,
        model_metadata=item.model_metadata
    )
