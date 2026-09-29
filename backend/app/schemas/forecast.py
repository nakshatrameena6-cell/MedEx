from typing import List, Optional
from pydantic import BaseModel, Field


class ForecastItem(BaseModel):
    facility_id: str = Field(..., description="Facility ID e.g. TN-PHC-014")
    drug_id: str = Field(..., description="Drug identifier e.g. ORS")
    horizon_days: int = Field(30, description="Forecast window in days")
    predicted_demand: int = Field(..., description="Predicted demand quantity")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0 to 1")
    forecast_date: str = Field(..., description="YYYY-MM-DD date string")


class ForecastResponse(BaseModel):
    forecasts: List[ForecastItem] = Field(default_factory=list)
