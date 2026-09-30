from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class RiskItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(..., description="Facility ID")
    drug_id: str = Field(..., validation_alias=AliasChoices("drug_id", "drug_code"), description="Drug code e.g. ORS")
    drug_code: Optional[str] = Field(None)
    risk_level: str = Field(..., description="RED, AMBER, GREEN or HIGH, MEDIUM, LOW")
    status: str = Field("AMBER", description="RED, AMBER, GREEN")
    stockout_days: int = Field(..., description="Estimated days until stockout")
    cover_days: float = Field(..., description="P50 Days of stock cover")
    cover_days_p90: float = Field(..., description="P90 Conservative Days of stock cover")
    lead_time_days: int = Field(4, description="Drug replenishment lead time in days")
    safety_buffer_days: int = Field(2, description="Safety buffer in days")
    p_stockout: float = Field(..., ge=0.0, le=1.0, description="Probability of stockout within lead time")
    drug_criticality: int = Field(1, description="Drug criticality weight")
    vulnerability_weight: float = Field(1.0, description="Facility vulnerability multiplier")
    priority: float = Field(..., description="Risk priority score")
    exposure_units: int = Field(..., ge=0, description="Projected shortage exposure quantity")
    confidence: float = Field(0.90, ge=0.0, le=1.0, description="Assessment confidence score")
    reason: str = Field(..., description="Deterministic human-readable explanation")
    flags: List[str] = Field(default_factory=list, description="Deterministic risk condition flags")


class RiskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    district_id: Optional[str] = Field("TN-D01")
    as_of: Optional[str] = Field(None)
    resilience: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "score": 92.0,
            "previous_week_score": 90.0,
            "delta": 2.0,
            "drift_alert": False
        }
    )
    items: List[RiskItem] = Field(default_factory=list, validation_alias=AliasChoices("items", "risks"))
    risks: Optional[List[RiskItem]] = Field(None)
