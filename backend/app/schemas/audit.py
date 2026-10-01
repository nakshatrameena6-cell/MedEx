from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AuditLogItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    audit_id: Optional[str] = Field(None, validation_alias=AliasChoices("audit_id", "id"))
    id: Optional[Any] = Field(None)
    ts: Optional[str] = Field(None, validation_alias=AliasChoices("ts", "timestamp"))
    timestamp: Optional[str] = Field(None)
    actor: Optional[str] = Field(None, validation_alias=AliasChoices("actor", "user_id"))
    user_id: Optional[str] = Field(None)
    role: str = Field(...)
    action: str = Field(...)
    entity_type: Optional[str] = Field(None, validation_alias=AliasChoices("entity_type", "resource"))
    resource: Optional[str] = Field(None)
    entity_id: Optional[str] = Field(None, validation_alias=AliasChoices("entity_id", "resource_id"))
    resource_id: Optional[str] = Field(None)
    comment: Optional[str] = Field(None, validation_alias=AliasChoices("comment", "result"))
    result: Optional[str] = Field("SUCCESS")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AuditLogsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[AuditLogItem] = Field(default_factory=list, validation_alias=AliasChoices("items", "logs"))
    logs: Optional[List[AuditLogItem]] = Field(None)
    next_cursor: Optional[str] = Field(None)
