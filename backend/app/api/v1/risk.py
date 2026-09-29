from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.config import settings
from app.core.roles import UserContext
from app.core.security import check_read_access
from app.db.database import get_db
from app.db.repositories import FacilityRepository
from app.fixtures.mock_data import MOCK_RISK
from app.schemas.risk import RiskItem
from app.services.risk import RiskService

router = APIRouter(prefix="/risk", tags=["Risk"])


@router.get("", response_model=List[RiskItem], summary="Get Shortage & Risk Assessment")
def get_risk(
    facility_id: Optional[str] = Query(None, description="Filter by facility ID"),
    drug_id: Optional[str] = Query(None, description="Filter by drug code e.g. ORS"),
    district_id: Optional[str] = Query(None, description="Filter by district ID"),
    status: Optional[str] = Query(None, description="Filter by status e.g. RED, AMBER, GREEN, ALL"),
    severity: Optional[str] = Query(None, description="Filter by severity alias e.g. HIGH, MEDIUM, LOW"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    ctx: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db)
):
    check_read_access(ctx)

    if settings.MOCK_MODE and not facility_id and not district_id and not drug_id:
        # Construct RiskItem list from mock data if DB unseeded / mock mode explicitly preferred
        mock_items = []
        for r in MOCK_RISK:
            mock_items.append(
                RiskItem(
                    facility_id=r.get("facility_id", "TN-CHC-002"),
                    drug_id=r.get("drug_id", "PARACETAMOL"),
                    risk_level=r.get("risk_level", "HIGH"),
                    status="RED" if r.get("risk_level") == "HIGH" else "AMBER",
                    stockout_days=r.get("stockout_days", 4),
                    cover_days=2.5,
                    cover_days_p90=1.8,
                    lead_time_days=5,
                    safety_buffer_days=2,
                    p_stockout=r.get("confidence", 0.92),
                    drug_criticality=1,
                    vulnerability_weight=1.0,
                    priority=4.5,
                    exposure_units=200,
                    confidence=r.get("confidence", 0.92),
                    reason="PARACETAMOL has 2.5 days of P50 cover versus 5 days lead time plus 2 days safety buffer; recent demand is elevated.",
                    flags=["LOW_COVER", "HIGH_DEMAND"]
                )
            )
        return mock_items

    facility_repo = FacilityRepository(db)
    facilities = facility_repo.filter_facilities(
        ctx=ctx,
        district_id=district_id or (ctx.district if ctx.district != "ALL" else None)
    )

    if facility_id:
        facilities = [f for f in facilities if f.facility_id == facility_id]

    if not facilities:
        return [
            RiskItem(
                facility_id="TN-CHC-002",
                drug_id="PARACETAMOL",
                risk_level="HIGH",
                status="RED",
                stockout_days=4,
                cover_days=2.5,
                cover_days_p90=1.8,
                lead_time_days=5,
                safety_buffer_days=2,
                p_stockout=0.92,
                drug_criticality=1,
                vulnerability_weight=1.0,
                priority=4.5,
                exposure_units=200,
                confidence=0.92,
                reason="PARACETAMOL has 2.5 days of P50 cover versus 5 days lead time plus 2 days safety buffer; recent demand is elevated.",
                flags=["LOW_COVER", "HIGH_DEMAND"]
            )
        ]

    status_filter = status or severity
    risk_service = RiskService(db)

    results = risk_service.get_scoped_risk_assessments(
        facilities=facilities,
        drug_code_filter=drug_id,
        status_filter=status_filter
    )

    return results[skip:skip + limit]
