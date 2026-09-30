from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AuditLogItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

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
    model_config = ConfigDict(populate_by_name=True)

    items: List[AuditLogItem] = Field(default_factory=list, validation_alias=AliasChoices("items", "logs"))
    logs: Optional[List[AuditLogItem]] = Field(None)
