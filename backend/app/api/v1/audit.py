from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_audit_access
from app.db.database import get_db
from app.db.repositories import AuditRepository
from app.fixtures.mock_data import MOCK_AUDIT
from app.schemas.audit import AuditLogItem, AuditLogsResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=AuditLogsResponse, summary="Get Audit Logs")
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_audit_access(ctx)
    repo = AuditRepository(db)
    logs = repo.get_scoped_logs(ctx, skip=skip, limit=limit)
    if not logs:
        return AuditLogsResponse(logs=[AuditLogItem(**log) for log in MOCK_AUDIT])

    items = [
        AuditLogItem(
            id=log.id,
            user_id=log.user_id,
            role=log.role,
            action=log.action,
            resource=log.resource,
            resource_id=log.resource_id,
            timestamp=log.timestamp.isoformat() + "Z" if log.timestamp else "2026-09-29T10:15:00Z",
            result=log.result,
            details=log.details or {}
        )
        for log in logs
    ]
    return AuditLogsResponse(logs=items)
