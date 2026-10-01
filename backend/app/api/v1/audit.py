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
        mock_items = [
            AuditLogItem(
                audit_id=log.get("audit_id") or f"AUD-{log.get('id', 1):06d}",
                id=log.get("id"),
                ts=log.get("timestamp"),
                timestamp=log.get("timestamp"),
                actor=log.get("user_id"),
                user_id=log.get("user_id"),
                role=log.get("role", "DISTRICT"),
                action=log.get("action", "OPTIMIZE_RUN"),
                entity_type=log.get("resource", "TRANSFER"),
                resource=log.get("resource", "TRANSFER"),
                entity_id=log.get("resource_id"),
                resource_id=log.get("resource_id"),
                comment=log.get("result"),
                result=log.get("result", "SUCCESS"),
                details=log.get("details") or {}
            )
            for log in MOCK_AUDIT
        ]
        return AuditLogsResponse(items=mock_items, logs=mock_items)

    items = [
        AuditLogItem(
            audit_id=f"AUD-{log.id:06d}",
            id=log.id,
            ts=log.timestamp.isoformat() + "Z" if log.timestamp else "2026-09-29T10:15:00Z",
            timestamp=log.timestamp.isoformat() + "Z" if log.timestamp else "2026-09-29T10:15:00Z",
            actor=log.user_id,
            user_id=log.user_id,
            role=log.role,
            action=log.action,
            entity_type=log.resource,
            resource=log.resource,
            entity_id=log.resource_id,
            resource_id=log.resource_id,
            comment=log.result,
            result=log.result,
            details=log.details or {}
        )
        for log in logs
    ]
    return AuditLogsResponse(items=items, logs=items)
