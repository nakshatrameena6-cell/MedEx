from typing import List, Optional
from pydantic import BaseModel, Field


class StockItemStatus(BaseModel):
    drug_id: str = Field(..., description="Drug identifier e.g. ORS")
    name: str = Field(..., description="Drug name")
    quantity: int = Field(..., description="Quantity in base unit")
    reorder_level: int = Field(..., description="Reorder threshold quantity")
    unit: str = Field("unit", description="Base unit")


class FacilitySummary(BaseModel):
    facility_id: str = Field(..., description="Facility ID e.g. TN-PHC-014")
    name: str = Field(..., description="Facility name")
    type: Optional[str] = Field("PHC", description="PHC, CHC, WAREHOUSE")
    facility_type: str = Field("PHC", description="PHC, CHC, or DH")
    state_code: Optional[str] = Field("TN", description="State code")
    state_id: Optional[str] = Field("TN", description="State ID")
    district_id: str = Field(..., description="District ID e.g. TN-D01")
    block: Optional[str] = Field(None, description="Block name/code")
    block_id: str = Field(..., description="Block ID e.g. TN-B01")
    status: Optional[str] = Field("NORMAL", description="Risk status e.g. RED, AMBER, GREEN, NORMAL")
    stock_status: str = Field("NORMAL", description="Status e.g. NORMAL, CRITICAL, SURPLUS")
    lat: Optional[float] = Field(None, description="Latitude")
    latitude: Optional[float] = Field(None)
    lng: Optional[float] = Field(None, description="Longitude")
    longitude: Optional[float] = Field(None)
    population_served: Optional[int] = Field(None)
    bed_capacity: Optional[int] = Field(None)
    is_active: Optional[bool] = Field(True)
    road_access_status: Optional[str] = Field("ACCESSIBLE")
    dataset_type: Optional[str] = Field("synthetic_demo")


class FacilityListResponse(BaseModel):
    as_of: str = Field(..., description="ISO-8601 UTC timestamp")
    items: List[FacilitySummary] = Field(default_factory=list)


class FacilityStatusResponse(BaseModel):
    facility_id: str = Field(...)
    name: str = Field(...)
    district_id: str = Field(...)
    block_id: str = Field(...)
    items: List[StockItemStatus] = Field(default_factory=list)
    last_updated: str = Field(..., description="ISO-8601 UTC timestamp")
