from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ScenarioRunRequest(BaseModel):
    scenario_type: str = Field(..., description="e.g. MONSOON_SPIKE, SUPPLY_CHAIN_BREAK")
    district_id: Optional[str] = Field(None)
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ScenarioRunResponse(BaseModel):
    scenario_id: str = Field(...)
    status: str = Field(...)
    projected_shortages_count: int = Field(...)
    summary: str = Field(...)
