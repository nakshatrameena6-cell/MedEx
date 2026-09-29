from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_copilot_access
from app.schemas.copilot import CopilotAskRequest, CopilotAskResponse
from app.services.audit import audit_service

router = APIRouter(prefix="/copilot", tags=["Copilot"])


@router.post("/ask", response_model=CopilotAskResponse, summary="Query Gemini Health Supply Copilot")
def copilot_ask(
    body: CopilotAskRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_copilot_access(ctx)
    audit_service.record(ctx, "COPILOT_ASK", "copilot", details={"prompt": body.prompt})
    return CopilotAskResponse(
        answer=f"[MOCK RESPONSE] Analysis for prompt: '{body.prompt}'. Current supply resilience score in district {ctx.district} is 92%. No immediate stockouts predicted for essential vaccines.",
        data_sources={"district": ctx.district, "model": "gemini-1.5-flash-mock"}
    )
