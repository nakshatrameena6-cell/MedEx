from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class RouteInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    polyline: str = Field("w~abA~_seM_@aA", description="Google encoded polyline")
    duration_min: int = Field(45, description="Estimated duration in minutes")


class TransferItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    transfer_id: str = Field(...)
    run_id: Optional[str] = Field(None)
    rank: Optional[int] = Field(1)
    source_facility_id: str = Field(...)
    destination_facility_id: str = Field(...)
    from_party: Optional[Dict[str, Any]] = Field(None, validation_alias=AliasChoices("from_party", "from"))
    to_party: Optional[Dict[str, Any]] = Field(None, validation_alias=AliasChoices("to_party", "to"))
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
    model_config = ConfigDict(populate_by_name=True)

    items: List[TransferItem] = Field(default_factory=list, validation_alias=AliasChoices("items", "transfers"))
    transfers: Optional[List[TransferItem]] = Field(None)


class TransferDecisionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    decision: str = Field(
        ...,
        validation_alias=AliasChoices("decision", "action"),
        description="APPROVE, MODIFY, REJECT, ESCALATE, MARK_DONE"
    )
    action: Optional[str] = Field(None, description="Alias for decision")
    comment: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("comment", "decision_comment", "notes"),
        description="Optional or mandatory decision notes/comment"
    )
    notes: Optional[str] = Field(None, description="Alias for comment")
    decision_comment: Optional[str] = Field(None, description="Alias for comment")
    modified_qty: Optional[int] = Field(None, description="Modified transfer quantity")
    modified_source_facility_id: Optional[str] = Field(None, description="Modified source facility ID")
    modified_destination_facility_id: Optional[str] = Field(None, description="Modified destination facility ID")


class TransferDecisionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    transfer_id: str = Field(...)
    status: str = Field(...)
    decided_by: str = Field(...)
    timestamp: str = Field(...)
    details: Optional[Dict[str, Any]] = Field(None)
