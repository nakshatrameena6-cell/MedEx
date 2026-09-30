from typing import List
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_federation_round_access, check_federation_history_access
from app.fixtures.mock_data import MOCK_FEDERATION_ROUNDS
from app.schemas.federation import (
    FederationRoundRequest, FederationRoundItem, FederationRoundsResponse
)
from app.services.audit import audit_service

router = APIRouter(prefix="/federation", tags=["Federation"])


@router.post("/round", response_model=FederationRoundItem, summary="Trigger Federated Learning Training Round")
def trigger_federation_round(
    body: FederationRoundRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_federation_round_access(ctx)
    audit_service.record(ctx, "TRIGGER_FEDERATION_ROUND", "federation")
    return FederationRoundItem(
        round_id="FED-R02",
        round_number=body.round_number or 2,
        participating_nodes=15,
        status="IN_PROGRESS",
        accuracy=0.95,
        timestamp="2026-09-29T10:45:00Z"
    )


@router.get("/rounds", response_model=FederationRoundsResponse, summary="Get Federated Learning Round History")
def get_federation_rounds(ctx: UserContext = Depends(get_current_user_context)):
    check_federation_history_access(ctx)
    return FederationRoundsResponse(
        rounds=[FederationRoundItem(**r) for r in MOCK_FEDERATION_ROUNDS]
    )
