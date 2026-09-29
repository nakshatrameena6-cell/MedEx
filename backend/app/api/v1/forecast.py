from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.config import settings
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.db.database import get_db
from app.db.repositories import FacilityRepository, DrugMasterRepository
from app.fixtures.mock_data import MOCK_FORECAST
from app.schemas.forecast import ForecastItem
from app.services.forecast import ForecastService

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("", response_model=List[ForecastItem], summary="Get Stock Demand Forecast")
def get_forecast(
    facility_id: Optional[str] = Query(None, description="Filter by facility ID"),
    drug_id: Optional[str] = Query(None, description="Filter by drug code e.g. ORS"),
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    horizon_days: int = Query(30, ge=1, le=180, description="Forecast horizon in days"),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)

    if settings.MOCK_MODE and not facility_id and not district_id:
        return [ForecastItem(**item) for item in MOCK_FORECAST]

    facility_repo = FacilityRepository(db)
    facilities = facility_repo.filter_facilities(
        ctx=ctx,
        district_id=district_id or (ctx.district if ctx.district != "ALL" else None)
    )

    if facility_id:
        facilities = [f for f in facilities if f.facility_id == facility_id]

    if not facilities:
        return [ForecastItem(**item) for item in MOCK_FORECAST]

    service = ForecastService(db)
    drug_repo = DrugMasterRepository(db)

    drugs = [drug_id.upper()] if drug_id else [d.drug_code for d in drug_repo.get_all(0, 100)]
    if not drugs:
        drugs = ["ORS", "PARA"]

    forecast_results: List[ForecastItem] = []
    # Limit number of calculated pairs to keep API response fast for prototype
    for fac in facilities[:10]:
        for d_code in drugs[:5]:
            item = service.compute_forecast_for_facility_drug(fac.facility_id, d_code, horizon_days=horizon_days)
            forecast_results.append(item)

    return forecast_results
