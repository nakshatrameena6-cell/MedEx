from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.fixtures.mock_data import MOCK_FACILITIES, MOCK_FACILITY_STATUS
from app.schemas.facilities import FacilitySummary, FacilityStatusResponse

router = APIRouter(prefix="/facilities", tags=["Facilities"])


@router.get("", response_model=List[FacilitySummary], summary="List Facilities")
def get_facilities(ctx: UserContext = Depends(get_current_user_context)):
    check_read_access(ctx)
    return [FacilitySummary(**f) for f in MOCK_FACILITIES]


@router.get("/{facility_id}/status", response_model=FacilityStatusResponse, summary="Get Facility Stock Status")
def get_facility_status(
    facility_id: str,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_read_access(ctx)
    res = dict(MOCK_FACILITY_STATUS)
    res["facility_id"] = facility_id
    return FacilityStatusResponse(**res)
