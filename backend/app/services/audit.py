from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.core.roles import UserContext
from app.db.models import AuditLog
from app.db.repositories import AuditRepository


class AuditService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def record(
        self,
        ctx: UserContext,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        result: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[AuditLog]:
        log_entry = {
            "user_id": ctx.user_id,
            "role": ctx.role.value,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "result": result,
            "details": details or {"district": ctx.district}
        }
        if self.db:
            repo = AuditRepository(self.db)
            audit_obj = AuditLog(**log_entry)
            return repo.create(audit_obj)
        return None


audit_service = AuditService()
