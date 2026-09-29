from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_audit_access
from app.fixtures.mock_data import MOCK_AUDIT
from app.schemas.audit import AuditLogItem, AuditLogsResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=AuditLogsResponse, summary="Get Audit Logs")
def get_audit_logs(ctx: UserContext = Depends(get_current_user_context)):
    check_audit_access(ctx)
    return AuditLogsResponse(logs=[AuditLogItem(**log) for log in MOCK_AUDIT])
