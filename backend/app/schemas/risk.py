from typing import List
from pydantic import BaseModel, Field


class RiskItem(BaseModel):
    facility_id: str = Field(...)
    drug_id: str = Field(...)
    risk_level: str = Field(..., description="HIGH, MEDIUM, LOW")
    stockout_days: int = Field(..., description="Days until stockout")
    confidence: float = Field(..., ge=0.0, le=1.0)


class RiskResponse(BaseModel):
    risks: List[RiskItem] = Field(default_factory=list)
