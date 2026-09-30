from typing import List, Optional
from pydantic import BaseModel, Field


class AlertItem(BaseModel):
    alert_id: str = Field(...)
    facility_id: str = Field(...)
    severity: str = Field(..., description="INFO, WARNING, CRITICAL")
    message: str = Field(...)
    timestamp: str = Field(...)


class AlertsResponse(BaseModel):
    alerts: List[AlertItem] = Field(default_factory=list)


class AlertAudioResponse(BaseModel):
    alert_id: str = Field(...)
    audio_url: str = Field(..., description="URL to access audio snippet")
    audio_format: str = Field("mp3", description="Audio encoding format")
    duration_seconds: float = Field(..., description="Duration in seconds")
    transcript: Optional[str] = Field(None, description="Transcript of audio notification")

