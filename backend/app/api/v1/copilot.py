from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_copilot_access
from app.db.database import get_db
from app.schemas.copilot import CopilotAskRequest, CopilotAskResponse
from app.services.copilot import CopilotService

router = APIRouter(prefix="/copilot", tags=["Copilot"])


@router.post("", response_model=CopilotAskResponse, summary="Query Gemini Health Supply Copilot")
@router.post("/ask", response_model=CopilotAskResponse, summary="Query Gemini Health Supply Copilot")
def copilot_ask(
    body: CopilotAskRequest,
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_copilot_access(ctx)
    service = CopilotService(db)
    return service.ask(body, ctx)

