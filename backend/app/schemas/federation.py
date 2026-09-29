from typing import List, Optional
from pydantic import BaseModel, Field


class FederationRoundRequest(BaseModel):
    round_number: Optional[int] = Field(None, description="Round number to trigger")


class FederationRoundItem(BaseModel):
    round_id: str = Field(...)
    round_number: int = Field(...)
    participating_nodes: int = Field(...)
    status: str = Field(...)
    accuracy: float = Field(...)
    timestamp: str = Field(...)


class FederationRoundsResponse(BaseModel):
    rounds: List[FederationRoundItem] = Field(default_factory=list)
