from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CopilotAskRequest(BaseModel):
    prompt: str = Field(..., description="Query for Gemini copilot")
    context_facility_id: Optional[str] = Field(None, description="Optional facility context")
    context_district_id: Optional[str] = Field(None, description="Optional district context")
    context_drug_code: Optional[str] = Field(None, description="Optional drug code context")
    context_transfer_id: Optional[str] = Field(None, description="Optional transfer context")


class CopilotAskResponse(BaseModel):
    answer: str = Field(...)
    confidence: float = Field(0.95, ge=0.0, le=1.0, description="Model response confidence")
    sources: List[str] = Field(default_factory=list, description="Grounding source facts used")
    supporting_facts: Dict[str, Any] = Field(default_factory=dict, description="Structured factual context")
    limitations: Optional[str] = Field(None, description="Explicit uncertainty disclosure")
    generated_at: str = Field(..., description="ISO 8601 UTC timestamp")
    model: str = Field("gemini-1.5-pro", description="Gemini model name")
    data_sources: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Legacy data sources map")

