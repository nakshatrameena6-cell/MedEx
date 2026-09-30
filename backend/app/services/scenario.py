import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.roles import UserContext, UserRole
from app.db.models import DrugMaster, Facility, ScenarioRecord, StockSnapshot
from app.db.repositories import FacilityRepository, StockSnapshotRepository
from app.schemas.scenario import ScenarioRunRequest, ScenarioRunResponse, ScenarioListResponse
from app.services.audit import audit_service
from app.services.copilot import GeminiAdapter
from app.services.forecast import ForecastService
from app.services.optimizer import RedistributionOptimizer, OptimizationRequest
from app.services.risk import RiskService


class ScenarioService:
    def __init__(self, db: Session):
        self.db = db
        self.facility_repo = FacilityRepository(db)
        self.stock_repo = StockSnapshotRepository(db)
        self.forecast_service = ForecastService(db)
        self.risk_service = RiskService(db)
        self.optimizer = RedistributionOptimizer(db)
        self.gemini_adapter = GeminiAdapter()

    def run_simulation(self, request: ScenarioRunRequest, ctx: UserContext) -> ScenarioRunResponse:
        # Enforce RBAC Scoping
        target_district = request.district_id or (ctx.district if ctx.district != "ALL" else "TN-D01")
        if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT):
            if ctx.district and ctx.district != "ALL" and target_district != ctx.district:
                raise ForbiddenError(
                    message=f"Requested simulation district {target_district} is outside authorized scope {ctx.district}"
                )
        elif ctx.role == UserRole.FACILITY:
            if ctx.district and ctx.district != "ALL" and target_district != ctx.district:
                raise ForbiddenError(message=f"Facility role cannot simulate district {target_district} outside authorized scope {ctx.district}")

        params = request.parameters or {}
        scenario_type = request.scenario_type.upper()

        # Parse scenario parameters based on type or explicit params
        demand_multiplier = 1.0
        stock_multiplier = 1.0
        blocked_facs = list(params.get("unavailable_facility_ids", []))

        if scenario_type == "MONSOON_SPIKE":
            demand_multiplier = float(params.get("demand_multiplier", 1.5))
            stock_multiplier = float(params.get("stock_multiplier", 0.9))
        elif scenario_type == "SUPPLY_CHAIN_BREAK":
            stock_multiplier = float(params.get("stock_multiplier", 0.5))
            demand_multiplier = float(params.get("demand_multiplier", 1.2))
        elif scenario_type == "DEMAND_SURGE":
            demand_multiplier = float(params.get("demand_multiplier", 1.75))
        else:
            demand_multiplier = float(params.get("demand_multiplier", 1.0))
            stock_multiplier = float(params.get("stock_multiplier", 1.0))

        if "demand_change_pct" in params:
            demand_multiplier = 1.0 + (float(params["demand_change_pct"]) / 100.0)
        if "stock_change_pct" in params:
            stock_multiplier = 1.0 + (float(params["stock_change_pct"]) / 100.0)

        # 1. Gather Baseline Data (READ-ONLY)
        facilities = self.facility_repo.filter_facilities(ctx=ctx, district_id=target_district)
        if not facilities:
            facilities = self.db.query(Facility).filter(Facility.district_id == target_district).all()

        drugs = self.db.query(DrugMaster).limit(5).all()
        if not drugs:
            drugs = [DrugMaster(drug_code="ORS", drug_name="Oral Rehydration Salts", criticality=1, unit="sachet")]

        baseline_shortages = 0
        simulated_shortages = 0
        risk_shifts: List[Dict[str, Any]] = []

        # 2. Run Deterministic Risk & Forecast Calculations (Baseline vs In-Memory Simulated)
        for fac in facilities:
            if fac.facility_id in blocked_facs:
                risk_shifts.append({
                    "facility_id": fac.facility_id,
                    "facility_name": fac.name,
                    "baseline_risk": fac.stock_status or "NORMAL",
                    "simulated_risk": "UNAVAILABLE",
                    "reason": "Facility out-of-commission in simulation scenario"
                })
                simulated_shortages += 1
                continue

            for drug in drugs[:2]:
                sn = self.db.query(StockSnapshot).filter(
                    StockSnapshot.facility_id == fac.facility_id,
                    StockSnapshot.drug_code == drug.drug_code
                ).first()

                # Baseline computation
                base_rk = self.risk_service.compute_risk_for_facility_drug(fac, drug, sn)
                if base_rk.risk_level in ("RED", "CRITICAL"):
                    baseline_shortages += 1

                # In-memory simulated computation (NO DB MUTATION)
                base_qty = sn.usable_quantity if (sn and sn.usable_quantity is not None) else 200
                sim_qty = max(0, int(base_qty * stock_multiplier))
                
                # Create dummy snapshot copy for simulation
                dummy_sn = StockSnapshot(
                    facility_id=fac.facility_id,
                    drug_code=drug.drug_code,
                    snapshot_date=sn.snapshot_date if sn else datetime.date.today(),
                    quantity=sim_qty,
                    usable_quantity=sim_qty,
                    expiry_date=sn.expiry_date if sn else (datetime.date.today() + datetime.timedelta(days=90)),
                    batch_id=sn.batch_id if sn else "SIM-BATCH"
                )

                # Simulated risk calculation with adjusted demand multiplier
                sim_rk = self.risk_service.compute_risk_for_facility_drug(fac, drug, dummy_sn)
                sim_cover = max(1, int(sim_rk.cover_days / demand_multiplier)) if sim_rk.cover_days else 5
                
                sim_risk_level = "GREEN"
                if sim_cover <= 3:
                    sim_risk_level = "RED"
                    simulated_shortages += 1
                elif sim_cover <= 7:
                    sim_risk_level = "AMBER"

                if base_rk.risk_level != sim_risk_level:
                    risk_shifts.append({
                        "facility_id": fac.facility_id,
                        "facility_name": fac.name,
                        "drug_code": drug.drug_code,
                        "baseline_risk": base_rk.risk_level,
                        "baseline_cover_days": base_rk.cover_days,
                        "simulated_risk": sim_risk_level,
                        "simulated_cover_days": sim_cover,
                        "shift": f"{base_rk.risk_level} -> {sim_risk_level}"
                    })

        # 3. Simulated Redistribution Optimization (READ-ONLY)
        opt_req = OptimizationRequest(
            district_id=target_district,
            drug_code="ORS",
            blocked_facility_ids=blocked_facs,
            max_proposals=3
        )
        opt_res = self.optimizer.optimize(opt_req, ctx)
        
        simulated_proposals = []
        for prop in opt_res.proposals:
            simulated_proposals.append({
                "simulated_transfer_id": f"SIM-{prop.transfer_id}",
                "source_facility_id": prop.from_facility_id,
                "destination_facility_id": prop.to_facility_id,
                "drug_code": prop.drug_code,
                "quantity": prop.proposed_qty,
                "status": "SIMULATED_PROPOSAL",
                "risk_reduction": prop.risk_reduction,
                "is_simulated": True
            })

        # 4. Generate Copilot Explanation for Scenario
        facts_summary = {
            "scenario_type": scenario_type,
            "district_id": target_district,
            "baseline_shortages": baseline_shortages,
            "simulated_shortages": simulated_shortages,
            "risk_shifts_count": len(risk_shifts),
            "simulated_proposals_count": len(simulated_proposals)
        }
        exp_res = self.gemini_adapter.generate_explanation(
            prompt=f"Explain impact of scenario '{scenario_type}' in district {target_district}",
            facts=facts_summary,
            is_mock=settings.MOCK_MODE
        )

        now = datetime.datetime.utcnow()
        sc_id = f"SCN-{now.strftime('%Y%m%d%H%M%S')}-{target_district}"

        summary_text = (
            f"Simulated '{scenario_type}' scenario for district {target_district}. "
            f"Projected shortages increased from {baseline_shortages} to {simulated_shortages} facilities. "
            f"Identified {len(simulated_proposals)} hypothetical transfer proposals to mitigate risks."
        )

        comparison_data = {
            "baseline_shortages": baseline_shortages,
            "simulated_shortages": simulated_shortages,
            "demand_multiplier": demand_multiplier,
            "stock_multiplier": stock_multiplier,
            "risk_shifts": risk_shifts[:10],
            "simulated_proposals": simulated_proposals,
            "copilot_explanation": exp_res["answer"]
        }

        # 5. Persist Scenario Record (Metadata ONLY)
        sc_rec = ScenarioRecord(
            scenario_id=sc_id,
            scenario_type=scenario_type,
            district_id=target_district,
            status="COMPLETED",
            projected_shortages_count=simulated_shortages,
            summary=summary_text,
            parameters=params,
            baseline_comparison=comparison_data,
            created_at=now,
            completed_at=now,
            created_by=ctx.user_id
        )
        self.db.add(sc_rec)
        self.db.commit()

        # 6. Audit Event Record
        audit_service.record(
            ctx,
            "SCENARIO_RUN",
            "SCENARIO",
            resource_id=sc_id,
            details={
                "scenario_type": scenario_type,
                "district_id": target_district,
                "projected_shortages": simulated_shortages,
                "is_simulated": True
            },
            db=self.db
        )

        return ScenarioRunResponse(
            scenario_id=sc_id,
            scenario_type=scenario_type,
            district_id=target_district,
            status="COMPLETED",
            projected_shortages_count=simulated_shortages,
            summary=summary_text,
            baseline_comparison=comparison_data,
            is_simulated=True,
            created_at=now.isoformat() + "Z",
            completed_at=now.isoformat() + "Z"
        )

    def get_scenario(self, scenario_id: str, ctx: UserContext) -> ScenarioRunResponse:
        rec = self.db.query(ScenarioRecord).filter(ScenarioRecord.scenario_id == scenario_id).first()
        if not rec:
            raise NotFoundError(message=f"Scenario {scenario_id} not found")

        # RBAC scope check
        if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT):
            if ctx.district and ctx.district != "ALL" and rec.district_id != ctx.district:
                raise ForbiddenError(message=f"Scenario {scenario_id} outside authorized district scope {ctx.district}")

        c_at = rec.created_at.isoformat() + "Z" if rec.created_at else ""
        comp_at = rec.completed_at.isoformat() + "Z" if rec.completed_at else c_at

        return ScenarioRunResponse(
            scenario_id=rec.scenario_id,
            scenario_type=rec.scenario_type,
            district_id=rec.district_id,
            status=rec.status or "COMPLETED",
            projected_shortages_count=rec.projected_shortages_count or 0,
            summary=rec.summary or "",
            baseline_comparison=rec.baseline_comparison or {},
            is_simulated=True,
            created_at=c_at,
            completed_at=comp_at
        )

    def list_scenarios(self, ctx: UserContext) -> ScenarioListResponse:
        query = self.db.query(ScenarioRecord)
        if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT):
            if ctx.district and ctx.district != "ALL":
                query = query.filter(ScenarioRecord.district_id == ctx.district)
        
        recs = query.order_by(ScenarioRecord.created_at.desc()).all()
        items = []
        for rec in recs:
            c_at = rec.created_at.isoformat() + "Z" if rec.created_at else ""
            comp_at = rec.completed_at.isoformat() + "Z" if rec.completed_at else c_at
            items.append(
                ScenarioRunResponse(
                    scenario_id=rec.scenario_id,
                    scenario_type=rec.scenario_type,
                    district_id=rec.district_id,
                    status=rec.status or "COMPLETED",
                    projected_shortages_count=rec.projected_shortages_count or 0,
                    summary=rec.summary or "",
                    baseline_comparison=rec.baseline_comparison or {},
                    is_simulated=True,
                    created_at=c_at,
                    completed_at=comp_at
                )
            )
        return ScenarioListResponse(scenarios=items)
