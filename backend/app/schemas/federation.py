from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FederationRoundRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    round_number: Optional[int] = Field(None, description="Round number to trigger")
    participating_nodes: Optional[int] = Field(12, description="Number of participating nodes")
    aggregation_method: Optional[str] = Field("FedAvg", description="Aggregation method e.g. FedAvg")
    state_codes: Optional[List[str]] = Field(None, description="Participating state codes e.g. ['TN', 'BR']")
    local_epochs: Optional[int] = Field(5, description="Local training epochs per node")
    dp_noise: Optional[float] = Field(0.0, description="Differential privacy noise multiplier (simulated)")


class FederationRoundItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    round_id: str = Field(...)
    round_number: int = Field(...)
    participating_nodes: int = Field(...)
    status: str = Field(..., description="CREATED, COLLECTING, AGGREGATING, COMPLETED")
    accuracy: float = Field(...)
    loss: Optional[float] = Field(0.12)
    model_version: Optional[str] = Field("v1.1.0")
    aggregation_method: Optional[str] = Field("FedAvg")
    mode: Optional[str] = Field("simulated", description="Execution mode disclosure")
    timestamp: str = Field(...)
    completed_at: Optional[str] = Field(None)
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict)


class FederationRoundsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mode: str = Field("simulated", description="Explicit simulation disclosure per PRD requirements")
    rounds: List[FederationRoundItem] = Field(default_factory=list)


class LocalUpdateSubmissionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    node_id: str = Field(..., description="Node ID submitting weight update e.g. TN-NODE-01")
    local_samples: int = Field(..., ge=1, description="Number of local training samples")
    weights_delta: Dict[str, Any] = Field(..., description="Model weight updates delta")
