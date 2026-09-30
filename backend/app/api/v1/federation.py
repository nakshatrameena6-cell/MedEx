from typing import List
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_federation_round_access, check_federation_history_access
from app.db.database import get_db
from app.schemas.federation import (
    FederationRoundRequest, FederationRoundItem, FederationRoundsResponse, LocalUpdateSubmissionRequest
)
from app.services.federation import FederationService

router = APIRouter(prefix="/federation", tags=["Federation"])


@router.post("/round", response_model=FederationRoundItem, summary="Trigger Federated Learning Training Round")
def trigger_federation_round(
    body: FederationRoundRequest,
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_federation_round_access(ctx)
    service = FederationService(db)
    return service.trigger_round(body, ctx)


@router.get("/rounds", response_model=FederationRoundsResponse, summary="Get Federated Learning Round History")
def get_federation_rounds(
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_federation_history_access(ctx)
    service = FederationService(db)
    return service.get_rounds(ctx)


@router.post("/rounds/{round_id}/update", response_model=FederationRoundItem, summary="Submit Local Model Update to Federation Round")
def submit_local_update(
    body: LocalUpdateSubmissionRequest,
    round_id: str = Path(..., description="Federation Round ID e.g. FED-R01"),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    service = FederationService(db)
    return service.submit_local_update(round_id, body, ctx)

