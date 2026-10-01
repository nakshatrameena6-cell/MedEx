from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ForecastHistoryPoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: str = Field(..., description="YYYY-MM-DD date string")
    qty: float = Field(..., description="Actual issue quantity")


class ForecastPoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: str = Field(..., description="YYYY-MM-DD date string")
    p10: float = Field(..., description="P10 pessimistic demand forecast")
    p50: float = Field(..., description="P50 median demand forecast")
    p90: float = Field(..., description="P90 optimistic demand forecast")


class ForecastDriver(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., description="Driver factor name e.g. rainfall_7d")
    direction: str = Field("up", description="up or down")
    contribution_pct: float = Field(..., description="Contribution score percentage")


class ForecastModelMetadata(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model_name: str = Field("Deterministic Statistical Baseline")
    model_version: str = Field("1.0.0")
    history_window_days: int = Field(28)
    forecast_horizon_days: int = Field(30)
    generated_at: str = Field(...)
    methodology: str = Field(...)


DailyForecastPoint = ForecastPoint


class ForecastItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(..., description="Facility ID")
    drug_id: str = Field(..., validation_alias=AliasChoices("drug_id", "drug_code"), description="Drug identifier e.g. ORS")
    drug_code: Optional[str] = Field(None)
    horizon_days: int = Field(30, description="Forecast window in days")
    predicted_demand: int = Field(..., description="Predicted total P50 demand quantity across horizon")
    confidence: float = Field(0.85, ge=0.0, le=1.0, description="Confidence score 0 to 1")
    forecast_date: str = Field(..., description="YYYY-MM-DD date string")
    p10: Optional[float] = Field(None, description="Total P10 demand forecast")
    p50: Optional[float] = Field(None, description="Total P50 demand forecast")
    p90: Optional[float] = Field(None, description="Total P90 demand forecast")
    daily_forecast: List[DailyForecastPoint] = Field(default_factory=list)
    historical_actual_28d: Optional[List[int]] = Field(default_factory=list)
    drivers: List[Any] = Field(default_factory=list)
    model_metadata: Optional[ForecastModelMetadata] = Field(None)


class ForecastResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(..., description="Facility ID")
    drug_code: str = Field(..., validation_alias=AliasChoices("drug_code", "drug_id"), description="Drug code e.g. ORS")
    drug_id: Optional[str] = Field(None)
    unit: str = Field("sachets", description="Base unit")
    horizon_weeks: int = Field(4, description="Forecast horizon in weeks")
    horizon_days: Optional[int] = Field(30)
    model_version: str = Field("v1.1.0-simulated", description="Model version")
    model_scope: str = Field("federated", description="federated or local")
    generated_at: str = Field(..., description="ISO-8601 UTC timestamp")
    history: List[ForecastHistoryPoint] = Field(default_factory=list)
    points: List[ForecastPoint] = Field(default_factory=list, validation_alias=AliasChoices("points", "daily_forecast"))
    daily_forecast: Optional[List[DailyForecastPoint]] = Field(None)
    drivers: List[ForecastDriver] = Field(default_factory=list)
    predicted_demand: Optional[int] = Field(None)
    confidence: Optional[float] = Field(0.88)
    forecast_date: Optional[str] = Field(None)
    p10: Optional[float] = Field(None)
    p50: Optional[float] = Field(None)
    p90: Optional[float] = Field(None)
    model_metadata: Optional[ForecastModelMetadata] = Field(None)
