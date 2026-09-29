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
