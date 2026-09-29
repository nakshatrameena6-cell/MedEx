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
    state_id: Optional[str] = Field("TN", description="State ID")
    district_id: str = Field(..., description="District ID e.g. TN-D01")
    block_id: str = Field(..., description="Block ID e.g. TN-B01")
    facility_type: str = Field(..., description="PHC, CHC, or DH")
    stock_status: str = Field("NORMAL", description="Status e.g. NORMAL, CRITICAL, SURPLUS")
    latitude: Optional[float] = Field(None)
    longitude: Optional[float] = Field(None)
    population_served: Optional[int] = Field(None)
    bed_capacity: Optional[int] = Field(None)
    is_active: Optional[bool] = Field(True)
    road_access_status: Optional[str] = Field("ACCESSIBLE")
    dataset_type: Optional[str] = Field("synthetic_demo")



class FacilityStatusResponse(BaseModel):
    facility_id: str = Field(...)
    name: str = Field(...)
    district_id: str = Field(...)
    block_id: str = Field(...)
    items: List[StockItemStatus] = Field(default_factory=list)
    last_updated: str = Field(..., description="ISO-8601 UTC timestamp")
