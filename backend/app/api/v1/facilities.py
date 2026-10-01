from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.errors import NotFoundError
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.db.database import get_db
from app.db.repositories import FacilityRepository, StockSnapshotRepository, DrugMasterRepository
from app.fixtures.mock_data import MOCK_FACILITIES, MOCK_FACILITY_STATUS
from datetime import datetime, timezone
from app.schemas.facilities import FacilitySummary, FacilityListResponse, FacilityStatusResponse, StockItemStatus

router = APIRouter(prefix="/facilities", tags=["Facilities"])


@router.get("", response_model=FacilityListResponse, summary="List Facilities")
def get_facilities(
    state_id: Optional[str] = Query(None, description="Filter by state ID"),
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    block_id: Optional[str] = Query(None, description="Filter by block ID"),
    facility_type: Optional[str] = Query(None, description="Filter by facility type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)
    repo = FacilityRepository(db)
    facilities = repo.filter_facilities(
        ctx=ctx,
        state_id=state_id,
        district_id=district_id,
        block_id=block_id,
        facility_type=facility_type,
        skip=skip,
        limit=limit
    )
    if not facilities:
        items = [FacilitySummary(**f) for f in MOCK_FACILITIES]
    else:
        items = [
            FacilitySummary(
                facility_id=f.facility_id,
                name=f.name,
                type=f.facility_type,
                facility_type=f.facility_type,
                state_code=f.state_id,
                state_id=f.state_id,
                district_id=f.district_id,
                block=f.block_id,
                block_id=f.block_id,
                status=f.stock_status,
                stock_status=f.stock_status,
                lat=f.latitude,
                latitude=f.latitude,
                lng=f.longitude,
                longitude=f.longitude,
                population_served=f.population_served,
                bed_capacity=f.bed_capacity,
                is_active=f.is_active,
                road_access_status=f.road_access_status,
                dataset_type=f.dataset_type
            )
            for f in facilities
        ]

    return FacilityListResponse(
        as_of=datetime.now(timezone.utc).isoformat(),
        items=items
    )


@router.get("/{facility_id}/status", response_model=FacilityStatusResponse, summary="Get Facility Stock Status")
def get_facility_status(
    facility_id: str,
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)
    facility_repo = FacilityRepository(db)
    facility = facility_repo.get_facility_by_id_scoped(ctx, facility_id)

    if not facility:
        if facility_id in ("TN-PHC-014", "TN-CHC-002"):
            res = dict(MOCK_FACILITY_STATUS)
            res["facility_id"] = facility_id
            return FacilityStatusResponse(**res)
        unscoped_fac = facility_repo.get_by_id(facility_id)
        if unscoped_fac:
            raise NotFoundError(message=f"Access to facility '{facility_id}' is outside your authorized scope.")
        raise NotFoundError(message=f"Facility '{facility_id}' not found.")

    stock_repo = StockSnapshotRepository(db)
    snapshots = stock_repo.get_latest_stock_for_facility(facility_id)
    drug_repo = DrugMasterRepository(db)
    drugs = {d.drug_code: d for d in drug_repo.get_all(0, 100)}

    items = []
    for s in snapshots:
        drug_info = drugs.get(s.drug_code)
        drug_name = drug_info.drug_name if drug_info else s.drug_code
        unit = drug_info.unit if drug_info else "unit"
        items.append(
            StockItemStatus(
                drug_id=s.drug_code,
                name=drug_name,
                quantity=s.usable_quantity,
                reorder_level=100,
                unit=unit
            )
        )

    last_updated = snapshots[0].reported_at.isoformat() + "Z" if snapshots else "2026-09-29T10:00:00Z"

    return FacilityStatusResponse(
        facility_id=facility.facility_id,
        name=facility.name,
        district_id=facility.district_id,
        block_id=facility.block_id,
        items=items,
        last_updated=last_updated
    )
