from typing import List
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_scenario_access
from app.db.database import get_db
from app.schemas.scenario import (
    ScenarioRunRequest, ScenarioRunResponse, ScenarioListResponse
)
from app.services.scenario import ScenarioService

router = APIRouter(prefix="/scenario", tags=["Scenario"])


@router.post("", response_model=ScenarioRunResponse, summary="Run Supply Chain Simulation Scenario")
@router.post("/run", response_model=ScenarioRunResponse, summary="Run Supply Chain Simulation Scenario")
def run_scenario(
    body: ScenarioRunRequest,
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_scenario_access(ctx)
    service = ScenarioService(db)
    return service.run_simulation(body, ctx)


@router.get("", response_model=ScenarioListResponse, summary="List Simulation Scenarios")
@router.get("/history", response_model=ScenarioListResponse, summary="List Simulation Scenarios History")
def list_scenarios(
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_scenario_access(ctx)
    service = ScenarioService(db)
    return service.list_scenarios(ctx)


@router.get("/{scenario_id}", response_model=ScenarioRunResponse, summary="Get Simulation Scenario Details")
def get_scenario(
    scenario_id: str = Path(..., description="Scenario ID e.g. SCN-20260930-TN-D01"),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_scenario_access(ctx)
    service = ScenarioService(db)
    return service.get_scenario(scenario_id, ctx)

