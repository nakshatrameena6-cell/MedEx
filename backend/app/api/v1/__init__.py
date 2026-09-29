from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.capture import router as capture_router
from app.api.v1.facilities import router as facilities_router
from app.api.v1.forecast import router as forecast_router
from app.api.v1.risk import router as risk_router
from app.api.v1.optimize import router as optimize_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.scenario import router as scenario_router
from app.api.v1.federation import router as federation_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.audit import router as audit_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(capture_router)
api_v1_router.include_router(facilities_router)
api_v1_router.include_router(forecast_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(optimize_router)
api_v1_router.include_router(transfers_router)
api_v1_router.include_router(copilot_router)
api_v1_router.include_router(scenario_router)
api_v1_router.include_router(federation_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(audit_router)
