from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    district_id: Optional[str] = Field(None, description="District to optimize")
    max_distance_km: Optional[float] = Field(50.0, description="Max transfer distance in km")


class OptimizeResponse(BaseModel):
    optimization_id: str = Field(...)
    status: str = Field(...)
    transfers_recommended: int = Field(...)
    details: Optional[str] = Field(None)
