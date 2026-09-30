from typing import List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AlertItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    alert_id: str = Field(...)
    facility_id: str = Field(...)
    severity: str = Field(..., description="INFO, WARNING, CRITICAL")
    message: str = Field(...)
    timestamp: str = Field(...)


class AlertsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[AlertItem] = Field(default_factory=list, validation_alias=AliasChoices("items", "alerts"))
    alerts: Optional[List[AlertItem]] = Field(None)


class AlertAudioResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    alert_id: str = Field(...)
    audio_url: str = Field(..., description="URL to access audio snippet")
    audio_format: str = Field("mp3", description="Audio encoding format")
    duration_seconds: float = Field(..., description="Duration in seconds")
    transcript: Optional[str] = Field(None, description="Transcript of audio notification")
