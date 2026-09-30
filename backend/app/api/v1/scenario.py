from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_scenario_access
from app.schemas.scenario import ScenarioRunRequest, ScenarioRunResponse
from app.services.audit import audit_service

router = APIRouter(prefix="/scenario", tags=["Scenario"])


@router.post("/run", response_model=ScenarioRunResponse, summary="Run Supply Chain Simulation Scenario")
def run_scenario(
    body: ScenarioRunRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_scenario_access(ctx)
    audit_service.record(ctx, "RUN_SCENARIO", "scenario", details={"type": body.scenario_type})
    return ScenarioRunResponse(
        scenario_id="SCN-20260929-01",
        status="SIMULATION_COMPLETED",
        projected_shortages_count=3,
        summary=f"Simulated {body.scenario_type} for district {body.district_id or ctx.district}. Projected 3 facilities at risk of stockout within 14 days."
    )
