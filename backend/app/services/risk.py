import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.lead_times import get_drug_lead_time_config
from app.db.models import Alert, DiseaseSignals, DrugMaster, Facility, StockSnapshot
from app.schemas.risk import RiskItem
from app.services.forecast import ForecastService


class RiskService:
    def __init__(self, db: Session):
        self.db = db
        self.forecast_service = ForecastService(db)

    def compute_risk_for_facility_drug(
        self,
        facility: Facility,
        drug: DrugMaster,
        latest_snapshot: Optional[StockSnapshot] = None
    ) -> RiskItem:
        facility_id = facility.facility_id
        drug_code = drug.drug_code

        # Usable stock
        usable_stock = latest_snapshot.usable_quantity if latest_snapshot else 150

        # Forecast daily demand
        forecast = self.forecast_service.compute_forecast_for_facility_drug(facility_id, drug_code, horizon_days=30)
        p50_daily = forecast.p50 // 30 if forecast.p50 else 10
        p90_daily = forecast.p90 // 30 if forecast.p90 else 15

        if p50_daily <= 0:
            p50_daily = 1
        if p90_daily <= 0:
            p90_daily = p50_daily + 5

        # Cover days calculations
        cover_days = round(usable_stock / float(p50_daily), 1)
        cover_days_p90 = round(usable_stock / float(p90_daily), 1)

        # Lead time and safety buffer config
        lt_config = get_drug_lead_time_config(drug_code)
        lead_time = lt_config["lead_time_days"]
        safety_buffer = lt_config["safety_buffer_days"]

        # Risk Classification
        if usable_stock <= 0 or cover_days < (lead_time + safety_buffer):
            status = "RED"
            risk_level = "HIGH"
        elif cover_days < (2 * lead_time):
            status = "AMBER"
            risk_level = "MEDIUM"
        else:
            status = "GREEN"
            risk_level = "LOW"

        # Stockout Probability p_stockout
        lead_time_p50_demand = p50_daily * lead_time
        lead_time_p90_demand = p90_daily * lead_time

        if usable_stock <= 0:
            p_stockout = 1.0
        elif usable_stock < lead_time_p50_demand:
            p_stockout = min(1.0, round(0.5 + 0.5 * (lead_time_p50_demand - usable_stock) / float(lead_time_p50_demand), 2))
        elif usable_stock < lead_time_p90_demand:
            denom = max(1, (lead_time_p90_demand - lead_time_p50_demand))
            p_stockout = max(0.01, round(0.5 * (lead_time_p90_demand - usable_stock) / float(denom), 2))
        else:
            p_stockout = 0.0

        # Criticality Weight
        criticality_weight = 3 if drug.criticality == 1 else (2 if drug.criticality == 2 else 1)

        # Population Factor
        pop_factor = min(2.0, max(0.5, facility.population_served / 25000.0))

        # Vulnerability Weight
        vuln_weight = 1.25 if facility.road_access_status == "CONSTRAINED" else 1.0

        # Emergency Multiplier
        emergency_mult = 1.5 if status == "RED" or "disease signal" in " ".join(forecast.drivers).lower() else 1.0

        # Priority Score
        priority = round(p_stockout * criticality_weight * pop_factor * vuln_weight * emergency_mult, 2)

        # Exposure Units
        exposure_units = max(0, int((p50_daily * (lead_time + safety_buffer)) - usable_stock))

        # Flags
        flags: List[str] = []
        if cover_days < (lead_time + safety_buffer):
            flags.append("LOW_COVER")
        if usable_stock <= 0:
            flags.append("STOCKOUT")
        if p50_daily > 35:
            flags.append("HIGH_DEMAND")
        if facility.stock_status == "AT_RISK":
            flags.append("DELAYED_REPORT")
        if latest_snapshot and latest_snapshot.expiry_date and (latest_snapshot.expiry_date - datetime.date.today()).days <= 30:
            flags.append("NEAR_EXPIRY")
        if "disease signal" in " ".join(forecast.drivers).lower():
            flags.append("SEASONAL_PRESSURE")
        if facility.road_access_status == "CONSTRAINED":
            flags.append("HIGH_VULNERABILITY")

        # Reason string
        demand_desc = "elevated" if p50_daily > 30 else "normal"
        reason = f"{drug_code} has {cover_days} days of P50 cover versus {lead_time} days lead time plus {safety_buffer} days safety buffer; recent demand is {demand_desc}."

        stockout_days = max(0, int(cover_days))

        return RiskItem(
            facility_id=facility_id,
            drug_id=drug_code,
            risk_level=risk_level,
            status=status,
            stockout_days=stockout_days,
            cover_days=cover_days,
            cover_days_p90=cover_days_p90,
            lead_time_days=lead_time,
            safety_buffer_days=safety_buffer,
            p_stockout=p_stockout,
            drug_criticality=drug.criticality,
            vulnerability_weight=vuln_weight,
            priority=priority,
            exposure_units=exposure_units,
            confidence=0.90,
            reason=reason,
            flags=flags
        )

    def get_scoped_risk_assessments(
        self,
        facilities: List[Facility],
        drug_code_filter: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[RiskItem]:
        drugs_query = self.db.query(DrugMaster)
        if drug_code_filter:
            drugs_query = drugs_query.filter(DrugMaster.drug_code == drug_code_filter.upper())
        drugs = drugs_query.all()

        results: List[RiskItem] = []

        for facility in facilities:
            # Get latest snapshots for facility
            subq = (
                self.db.query(
                    StockSnapshot.drug_code,
                    StockSnapshot.usable_quantity,
                    StockSnapshot.expiry_date
                )
                .filter(StockSnapshot.facility_id == facility.facility_id)
                .all()
            )
            snapshot_map = {s.drug_code: s for s in subq}

            for drug in drugs:
                snapshot = snapshot_map.get(drug.drug_code)
                risk_item = self.compute_risk_for_facility_drug(facility, drug, snapshot)

                # Status filtering: default is AMBER and RED only
                if status_filter:
                    st_f = status_filter.upper()
                    if st_f == "ALL":
                        results.append(risk_item)
                    elif st_f == risk_item.status:
                        results.append(risk_item)
                else:
                    if risk_item.status in ("AMBER", "RED"):
                        results.append(risk_item)

        # Sort by priority descending
        results.sort(key=lambda r: r.priority, reverse=True)
        return results
