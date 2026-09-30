from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DailyForecastPoint(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD date")
    p10: int = Field(..., description="P10 pessimistic demand forecast")
    p50: int = Field(..., description="P50 median demand forecast")
    p90: int = Field(..., description="P90 optimistic demand forecast")


class ForecastModelMetadata(BaseModel):
    model_name: str = Field("Deterministic Statistical Baseline")
    model_version: str = Field("1.0.0")
    history_window_days: int = Field(28)
    forecast_horizon_days: int = Field(30)
    generated_at: str = Field(...)
    methodology: str = Field(...)


class ForecastItem(BaseModel):
    facility_id: str = Field(..., description="Facility ID")
    drug_id: str = Field(..., description="Drug identifier e.g. ORS")
    horizon_days: int = Field(30, description="Forecast window in days")
    predicted_demand: int = Field(..., description="Predicted total P50 demand quantity across horizon")
    confidence: float = Field(0.85, ge=0.0, le=1.0, description="Confidence score 0 to 1")
    forecast_date: str = Field(..., description="YYYY-MM-DD date string")
    p10: Optional[int] = Field(None, description="Total P10 demand forecast")
    p50: Optional[int] = Field(None, description="Total P50 demand forecast")
    p90: Optional[int] = Field(None, description="Total P90 demand forecast")
    daily_forecast: List[DailyForecastPoint] = Field(default_factory=list)
    historical_actual_28d: Optional[List[int]] = Field(default_factory=list)
    drivers: List[str] = Field(default_factory=list)
    model_metadata: Optional[ForecastModelMetadata] = Field(None)


class ForecastResponse(BaseModel):
    forecasts: List[ForecastItem] = Field(default_factory=list)
