from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RouteInfo(BaseModel):
    polyline: str = Field("w~abA~_seM_@aA", description="Google encoded polyline")
    duration_min: int = Field(45, description="Estimated duration in minutes")


class TransferItem(BaseModel):
    transfer_id: str = Field(...)
    run_id: Optional[str] = Field(None)
    rank: Optional[int] = Field(1)
    source_facility_id: str = Field(...)
    destination_facility_id: str = Field(...)
    drug_id: str = Field(...)
    drug_code: Optional[str] = Field(None)
    drug_name: Optional[str] = Field(None)
    unit: Optional[str] = Field("unit")
    quantity: int = Field(...)
    qty: Optional[int] = Field(None)
    status: str = Field("OPEN", description="OPEN, UNDER_REVIEW, APPROVED, REJECTED, ESCALATED, IN_TRANSIT, RECEIVED, CLOSED")
    state: Optional[str] = Field(None)
    eta_hours: Optional[float] = Field(1.5)
    distance_km: Optional[float] = Field(25.0)
    cost_inr: Optional[float] = Field(500.0)
    batch_expiry_date: Optional[str] = Field(None)
    expiry_ok: bool = Field(True)
    cross_state: bool = Field(False)
    route: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"polyline": "w~abA~_seM_@aA", "duration_min": 45})
    reason: Optional[str] = Field(None)
    created_at: str = Field(..., description="ISO-8601 UTC timestamp")
    updated_at: Optional[str] = Field(None)
    decided_by: Optional[str] = Field(None)
    decision_comment: Optional[str] = Field(None)



class TransfersResponse(BaseModel):
    transfers: List[TransferItem] = Field(default_factory=list)


class TransferDecisionRequest(BaseModel):
    action: str = Field(..., description="APPROVE, MODIFY, REJECT, ESCALATE, MARK_DONE")
    notes: Optional[str] = Field(None, description="Optional or mandatory decision notes/comment")
    decision_comment: Optional[str] = Field(None, description="Alias for notes")
    modified_qty: Optional[int] = Field(None, description="Modified transfer quantity")
    modified_source_facility_id: Optional[str] = Field(None, description="Modified source facility ID")
    modified_destination_facility_id: Optional[str] = Field(None, description="Modified destination facility ID")

    class Config:
        populate_by_name = True


class TransferDecisionResponse(BaseModel):
    transfer_id: str = Field(...)
    status: str = Field(...)
    decided_by: str = Field(...)
    timestamp: str = Field(...)
    details: Optional[Dict[str, Any]] = Field(None)

