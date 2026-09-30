import datetime
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Health Check")
def get_health():
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    return HealthResponse(
        status="ok",
        mock_mode=settings.MOCK_MODE,
        version=settings.VERSION,
        time=now_str,
        app=settings.PROJECT_NAME
    )
