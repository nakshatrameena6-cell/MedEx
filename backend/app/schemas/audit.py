from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AuditLogItem(BaseModel):
    id: int = Field(...)
    user_id: str = Field(...)
    role: str = Field(...)
    action: str = Field(...)
    resource: str = Field(...)
    resource_id: Optional[str] = Field(None)
    timestamp: str = Field(...)
    result: str = Field(...)
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AuditLogsResponse(BaseModel):
    logs: List[AuditLogItem] = Field(default_factory=list)
