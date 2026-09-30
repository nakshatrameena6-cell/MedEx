from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class CopilotAskRequest(BaseModel):
    prompt: str = Field(..., description="Query for Gemini copilot")
    context_facility_id: Optional[str] = Field(None, description="Optional facility context")


class CopilotAskResponse(BaseModel):
    answer: str = Field(...)
    data_sources: Optional[Dict[str, Any]] = Field(default_factory=dict)
