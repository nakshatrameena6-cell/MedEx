from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ScenarioRunRequest(BaseModel):
    scenario_type: str = Field(..., description="e.g. MONSOON_SPIKE, SUPPLY_CHAIN_BREAK, DEMAND_SURGE, CUSTOM")
    district_id: Optional[str] = Field(None, description="Target district ID e.g. TN-D01")
    parameters: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Hypothetical scenario parameters e.g. stock_change_pct, demand_change_pct, unavailable_facility_ids, transport_delay_hours"
    )


class ScenarioRunResponse(BaseModel):
    scenario_id: str = Field(...)
    scenario_type: str = Field("CUSTOM")
    district_id: str = Field(...)
    status: str = Field(..., description="CREATED, RUNNING, COMPLETED, FAILED")
    projected_shortages_count: int = Field(...)
    summary: str = Field(...)
    baseline_comparison: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Before vs After comparison metrics, risk shifts, and simulated redistribution proposals"
    )
    is_simulated: bool = Field(True, description="Always true; scenario proposals never alter production data")
    created_at: str = Field(...)
    completed_at: Optional[str] = Field(None)


class ScenarioListResponse(BaseModel):
    scenarios: List[ScenarioRunResponse] = Field(default_factory=list)
