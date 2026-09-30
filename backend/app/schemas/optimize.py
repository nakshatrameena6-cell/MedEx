from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.transfers import TransferItem


class OptimizeRequest(BaseModel):
    district_id: Optional[str] = Field(None, description="District to optimize")
    drug_code: Optional[str] = Field(None, description="Drug code to optimize (if omitted, all RED drugs)")
    emergency_mode: bool = Field(False, description="Emergency mode toggle")
    allow_cross_state: bool = Field(False, description="Allow cross-state transfers (only if emergency_mode=True)")
    blocked_facility_ids: List[str] = Field(default_factory=list, description="Facilities to exclude from optimization")
    max_proposals: int = Field(5, ge=1, le=20, description="Max proposals to return")
    max_distance_km: Optional[float] = Field(50.0, description="Legacy parameter for distance limit")


class OptimizeResponse(BaseModel):
    optimization_id: str = Field(...)
    run_id: str = Field(...)
    status: str = Field(..., description="OPTIMAL, FEASIBLE, INFEASIBLE")
    objective_value: float = Field(0.0, description="Optimizer objective value")
    transfers_recommended: int = Field(...)
    proposals: List[TransferItem] = Field(default_factory=list)
    details: Optional[str] = Field(None)

