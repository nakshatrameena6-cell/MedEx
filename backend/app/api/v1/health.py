from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.fixtures.mock_data import MOCK_HEALTH

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Health Check")
def get_health():
    return HealthResponse(**MOCK_HEALTH)
