from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str = Field("ok", description="Application status")
    mock_mode: bool = Field(True, description="Whether mock mode is active")
    version: str = Field("1.1.0", description="API version")
    time: str = Field(..., description="Dynamic ISO-8601 UTC server timestamp")
    app: Optional[str] = Field("MedEx API", description="Application name")
