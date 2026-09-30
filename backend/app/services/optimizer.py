import datetime
import math
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from ortools.linear_solver import pywraplp

from app.core.config import settings
from app.core.errors import AppException, ConstraintViolationError, ForbiddenError
from app.core.roles import UserContext, UserRole
from app.db.models import DrugMaster, Facility, StockSnapshot, Transfer
from app.db.repositories import FacilityRepository, StockSnapshotRepository, TransferRepository
from app.schemas.optimize import OptimizeRequest, OptimizeResponse
from app.schemas.transfers import TransferItem
from app.services.audit import audit_service
from app.services.forecast import ForecastService
from app.services.risk import RiskService


def haversine_distance(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> float:
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 20.0
    
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(max(distance, 1.0), 1)


class RedistributionOptimizer:
    def __init__(self, db: Session):
        self.db = db
        self.facility_repo = FacilityRepository(db)
        self.stock_repo = StockSnapshotRepository(db)
        self.transfer_repo = TransferRepository(db)
        self.forecast_service = ForecastService(db)
        self.risk_service = RiskService(db)

    def optimize(self, request: OptimizeRequest, ctx: UserContext, simulation_mode: bool = False) -> OptimizeResponse:
        # Rule 1: allow_cross_state validation
        if request.allow_cross_state and not request.emergency_mode:
            raise ConstraintViolationError(
                message="allow_cross_state is only valid when emergency_mode is true",
                details={"allow_cross_state": True, "emergency_mode": False}
            )

        # Scoping validation
        target_district = request.district_id or ctx.district
        if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT):
            if ctx.district and ctx.district != "ALL" and target_district != ctx.district:
                raise ForbiddenError(message=f"Requested district {target_district} is outside authorized scope {ctx.district}")

        # Fetch candidate facilities
        all_facilities = self.db.query(Facility).filter(Facility.is_active == True).all()
        blocked_set = set(request.blocked_facility_ids or [])
        
        # Filter facilities
        candidate_facilities = [
            f for f in all_facilities
            if f.facility_id not in blocked_set and f.road_access_status != "BLOCKED"
        ]

        if not request.allow_cross_state:
            # Must remain within district or authorized state scope
            if target_district and target_district != "ALL":
                candidate_facilities = [f for f in candidate_facilities if f.district_id == target_district]

        if not candidate_facilities:
            return self._build_infeasible_response("No available candidate facilities")

        fac_map = {f.facility_id: f for f in candidate_facilities}
        
        donors = []
        recipients = []

        target_drug = request.drug_code.upper() if request.drug_code else None
        all_drugs = self.db.query(DrugMaster).all()
        drug_map = {d.drug_code: d for d in all_drugs}

        for fac in candidate_facilities:
            snapshots = self.stock_repo.get_latest_stock_for_facility(fac.facility_id)
            for sn in snapshots:
                drug_code = sn.drug_code
                if target_drug and drug_code != target_drug:
                    continue

                usable_qty = sn.usable_quantity or 0
                
                forecast_item = self.forecast_service.compute_forecast_for_facility_drug(fac.facility_id, drug_code=drug_code, horizon_days=28)
                predicted_demand = getattr(forecast_item, "predicted_demand", 280)
                daily_demand = max(float(predicted_demand) / 28.0, 1.0)
                
                cover_days = usable_qty / daily_demand

                batch_expiry = sn.expiry_date
                expiry_ok = True
                if batch_expiry:
                    days_remaining = (batch_expiry - datetime.date.today()).days
                    if days_remaining < 16:
                        expiry_ok = False

                max_donor_qty = int(usable_qty - (14.0 * daily_demand))
                if max_donor_qty >= 1 and expiry_ok:
                    donors.append({
                        "facility_id": fac.facility_id,
                        "drug_code": drug_code,
                        "usable_stock": usable_qty,
                        "daily_demand": daily_demand,
                        "max_transferable": max_donor_qty,
                        "cover_days": cover_days,
                        "batch_expiry": batch_expiry
                    })

                drug_master = drug_map.get(drug_code)
                if drug_master:
                    risk_item = self.risk_service.compute_risk_for_facility_drug(fac, drug_master, sn)
                    risk_level = risk_item.risk_level
                    priority = risk_item.priority
                else:
                    risk_level = "NORMAL"
                    priority = 50.0

                if (target_drug and cover_days < 14) or (not target_drug and (risk_level in ("RED", "AMBER") or cover_days < 14)):
                    needed = int(math.ceil(14.0 * daily_demand - usable_qty))
                    needed = max(needed, 1)
                    recipients.append({
                        "facility_id": fac.facility_id,
                        "drug_code": drug_code,
                        "current_stock": usable_qty,
                        "daily_demand": daily_demand,
                        "needed_qty": needed,
                        "risk_level": risk_level,
                        "priority": priority,
                        "cover_days": cover_days
                    })

        if not donors or not recipients:
            return self._build_infeasible_response("No viable donor/recipient pairs found meeting safety cover constraints")

        VEHICLE_CAPACITY = 500

        solver = pywraplp.Solver.CreateSolver("CBC")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("GLOP")

        vars_map = {}
        for d_idx, d in enumerate(donors):
            for r_idx, r in enumerate(recipients):
                if d["drug_code"] != r["drug_code"]:
                    continue
                if d["facility_id"] == r["facility_id"]:
                    continue
                
                donor_fac = fac_map[d["facility_id"]]
                recip_fac = fac_map[r["facility_id"]]

                if donor_fac.state_id != recip_fac.state_id:
                    if not (request.emergency_mode and request.allow_cross_state):
                        continue

                max_possible = min(d["max_transferable"], r["needed_qty"], VEHICLE_CAPACITY)
                if max_possible < 1:
                    continue

                var_name = f"x_{d_idx}_{r_idx}"
                vars_map[(d_idx, r_idx)] = solver.IntVar(0, max_possible, var_name)

        if not vars_map:
            return self._build_infeasible_response("No valid transfer pairs after constraint filtering")

        for d_idx, d in enumerate(donors):
            d_vars = [vars_map[key] for key in vars_map if key[0] == d_idx]
            if d_vars:
                solver.Add(solver.Sum(d_vars) <= d["max_transferable"])

        for r_idx, r in enumerate(recipients):
            r_vars = [vars_map[key] for key in vars_map if key[1] == r_idx]
            if r_vars:
                solver.Add(solver.Sum(r_vars) <= r["needed_qty"])

        objective = solver.Objective()
        for (d_idx, r_idx), var in vars_map.items():
            d = donors[d_idx]
            r = recipients[r_idx]
            d_fac = fac_map[d["facility_id"]]
            r_fac = fac_map[r["facility_id"]]
            
            dist = haversine_distance(d_fac.latitude, d_fac.longitude, r_fac.latitude, r_fac.longitude)
            risk_weight = 100.0 if r["risk_level"] == "RED" else (50.0 if r["risk_level"] == "AMBER" else 20.0)
            priority_weight = float(r["priority"])
            
            coeff = (risk_weight + priority_weight) - (0.5 * dist)
            objective.SetCoefficient(var, coeff)

        objective.SetMaximization()

        solver_status = solver.Solve()
        
        if solver_status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
            return self._build_infeasible_response("Optimization solver returned infeasible")

        raw_proposals = []
        for (d_idx, r_idx), var in vars_map.items():
            qty = int(round(var.solution_value()))
            if qty >= 1:
                d = donors[d_idx]
                r = recipients[r_idx]
                d_fac = fac_map[d["facility_id"]]
                r_fac = fac_map[r["facility_id"]]
                dist = haversine_distance(d_fac.latitude, d_fac.longitude, r_fac.latitude, r_fac.longitude)
                
                score = var.solution_value() * objective.GetCoefficient(var)
                raw_proposals.append({
                    "donor": d,
                    "recipient": r,
                    "donor_fac": d_fac,
                    "recipient_fac": r_fac,
                    "qty": qty,
                    "dist": dist,
                    "score": score
                })

        if not raw_proposals:
            return self._build_infeasible_response("No non-zero transfers generated by solver")

        raw_proposals.sort(key=lambda x: x["score"], reverse=True)
        raw_proposals = raw_proposals[:request.max_proposals]

        run_id = f"OPT-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{ctx.user_id[:6]}"
        now_str = datetime.datetime.utcnow().isoformat() + "Z"

        proposals: List[TransferItem] = []
        db_transfers: List[Transfer] = []

        for rank, p in enumerate(raw_proposals, start=1):
            t_id = f"TRF-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{rank:02d}"
            d_fac = p["donor_fac"]
            r_fac = p["recipient_fac"]
            d = p["donor"]
            r = p["recipient"]
            qty = p["qty"]
            dist = p["dist"]

            eta_hrs = max(0.5, round(dist / 40.0, 1))
            cost_inr = round(500.0 + dist * 25.0, 2)
            is_cross_state = (d_fac.state_id != r_fac.state_id)
            
            enc_polyline = f"g~{d_fac.latitude or 12.9:.3f},{d_fac.longitude or 79.1:.3f}_to_{r_fac.latitude or 12.8:.3f},{r_fac.longitude or 79.2:.3f}"
            route_info = {"polyline": enc_polyline, "duration_min": int(eta_hrs * 60)}

            cover_after = round((d["usable_stock"] - qty) / d["daily_demand"], 1)
            cover_before = round(r["cover_days"], 1)

            reason_str = (
                f"Transfer {qty} unit(s) of {d['drug_code']} from {d_fac.name} (retains {cover_after}d cover) "
                f"to {r_fac.name} (risk {r['risk_level']}, initial cover {cover_before}d) over {dist}km. "
                f"Reduces stockout risk materially."
            )

            transfer_obj = Transfer(
                transfer_id=t_id,
                run_id=run_id,
                rank=rank,
                source_facility_id=d_fac.facility_id,
                destination_facility_id=r_fac.facility_id,
                drug_code=d["drug_code"],
                drug_name=d["drug_code"],
                unit="unit",
                quantity=qty,
                status="OPEN",
                eta_hours=eta_hrs,
                distance_km=dist,
                cost_inr=cost_inr,
                batch_expiry_date=d["batch_expiry"],
                expiry_ok=True,
                cross_state=is_cross_state,
                route=route_info,
                reason=reason_str,
                created_at=datetime.datetime.utcnow(),
                created_by=ctx.user_id
            )
            db_transfers.append(transfer_obj)

            proposal_item = TransferItem(
                transfer_id=t_id,
                run_id=run_id,
                rank=rank,
                source_facility_id=d_fac.facility_id,
                destination_facility_id=r_fac.facility_id,
                drug_id=d["drug_code"],
                drug_code=d["drug_code"],
                drug_name=d["drug_code"],
                unit="unit",
                quantity=qty,
                qty=qty,
                status="OPEN",
                state="OPEN",
                eta_hours=eta_hrs,
                distance_km=dist,
                cost_inr=cost_inr,
                batch_expiry_date=d["batch_expiry"].isoformat() if d["batch_expiry"] else None,
                expiry_ok=True,
                cross_state=is_cross_state,
                route=route_info,
                reason=reason_str,
                created_at=now_str
            )
            proposals.append(proposal_item)

        if not simulation_mode:
            for tr in db_transfers:
                self.db.add(tr)
            self.db.commit()

            audit_service.record(
                ctx,
                "OPTIMIZE_RUN",
                "TRANSFER",
                run_id,
                details={
                    "district": target_district,
                    "drug": target_drug or "ALL_RED",
                    "proposals_count": len(proposals),
                    "solver_status": "OPTIMAL"
                },
                db=self.db
            )

        return OptimizeResponse(
            optimization_id=run_id,
            run_id=run_id,
            status="OPTIMAL",
            objective_value=round(objective.Value(), 2),
            transfers_recommended=len(proposals),
            proposals=proposals,
            details=f"Generated {len(proposals)} ranked transfer proposal(s)"
        )

    def _build_infeasible_response(self, reason: str) -> OptimizeResponse:
        return OptimizeResponse(
            optimization_id=f"OPT-{datetime.datetime.utcnow().strftime('%Y%m%d')}-INFEASIBLE",
            run_id=f"OPT-{datetime.datetime.utcnow().strftime('%Y%m%d')}-INFEASIBLE",
            status="INFEASIBLE",
            objective_value=0.0,
            transfers_recommended=0,
            proposals=[],
            details=reason
        )
