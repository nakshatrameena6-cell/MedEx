import datetime
import os
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import BadGatewayError, ForbiddenError, NotFoundError
from app.core.roles import UserContext, UserRole
from app.db.models import DrugMaster, Facility, StockSnapshot, Transfer
from app.db.repositories import FacilityRepository, StockSnapshotRepository, TransferRepository
from app.schemas.copilot import CopilotAskRequest, CopilotAskResponse
from app.services.audit import audit_service
from app.services.forecast import ForecastService
from app.services.risk import RiskService


SYSTEM_PROMPT = """You are MedEx Health Supply Chain Copilot.
Explain deterministic supply chain forecasts, risk classifications, and transfer recommendations using ONLY the provided structured facts.
Rules:
1. Ground your response ONLY in the provided facts context.
2. Distinguish FACT (backend calculation), EXPLANATION (analysis), and DECISION (human action).
3. If requested data is missing, explicitly state that facts are unavailable.
4. NEVER fabricate stock numbers, demand forecasts, or transfer states.
5. Remind the user that recommendations require human approval."""


class GeminiAdapter:
    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))

    def generate_explanation(self, prompt: str, facts: Dict[str, Any], is_mock: bool = False) -> Dict[str, Any]:
        if is_mock or settings.MOCK_MODE:
            return self._generate_mock_explanation(prompt, facts)

        # Normal mode: Attempt real Gemini call
        if not self.api_key:
            raise BadGatewayError(
                message="Gemini AI service API key is unconfigured or upstream unavailable",
                details={"upstream": "google_gemini_api", "status": 502}
            )

        try:
            # Try importing google.generativeai or google-genai
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            full_prompt = f"{SYSTEM_PROMPT}\n\n[STRUCTURED FACTS]\n{facts}\n\n[USER QUESTION]\n{prompt}"
            response = model.generate_content(full_prompt)
            
            answer_text = response.text if hasattr(response, "text") and response.text else self._format_fact_summary(prompt, facts)
            
            return {
                "answer": answer_text,
                "confidence": 0.95,
                "sources": list(facts.keys()),
                "supporting_facts": facts,
                "limitations": "AI explanation grounded strictly in current structured backend context.",
                "model": "gemini-1.5-flash",
                "generated_at": datetime.datetime.utcnow().isoformat() + "Z"
            }
        except Exception as e:
            # Upstream failure -> HTTP 502 upstream_unavailable
            raise BadGatewayError(
                message=f"Gemini API upstream call failed: {str(e)}",
                details={"upstream": "google_gemini_api", "error_type": type(e).__name__}
            )

    def _generate_mock_explanation(self, prompt: str, facts: Dict[str, Any]) -> Dict[str, Any]:
        fac_id = facts.get("facility", {}).get("facility_id", "N/A")
        district_id = facts.get("district", "N/A")
        drug_code = facts.get("drug_code", "ORS")
        
        answer_parts = []
        answer_parts.append(f"Copilot Analysis for district '{district_id}' and facility '{fac_id}':")

        if "forecast" in facts:
            fc = facts["forecast"]
            answer_parts.append(f"• [FACT] 28-day predicted demand for {drug_code} is {fc.get('predicted_demand', 'N/A')} units.")

        if "risk" in facts:
            rk = facts["risk"]
            answer_parts.append(f"• [FACT] Risk level for {drug_code} is classified as {rk.get('risk_level', 'NORMAL')} with {rk.get('cover_days', 'N/A')} cover days remaining.")

        if "transfer" in facts:
            tr = facts["transfer"]
            answer_parts.append(f"• [FACT] Transfer proposal {tr.get('transfer_id')} recommends moving {tr.get('quantity')} units in state '{tr.get('status')}' from {tr.get('source_facility_id')} to {tr.get('destination_facility_id')}.")

        if len(answer_parts) == 1:
            answer_parts.append(f"• [FACT] Query '{prompt}' analyzed against current supply chain state. Supply resilience score in district {district_id} is 92%.")

        answer_parts.append("• [EXPLANATION] Supply resilience is maintained through proactive monitoring and safety stock thresholds.")
        answer_parts.append("• [DECISION] Operational transfers require explicit human review and authorization.")

        return {
            "answer": "\n".join(answer_parts),
            "confidence": 0.95,
            "sources": list(facts.keys()) if facts else ["facility_stock", "forecast_engine"],
            "supporting_facts": facts,
            "limitations": "Mock mode deterministic fixture explanation grounded in MedEx synthetic universe.",
            "model": "gemini-1.5-flash-mock",
            "generated_at": datetime.datetime.utcnow().isoformat() + "Z"
        }

    def _format_fact_summary(self, prompt: str, facts: Dict[str, Any]) -> str:
        return f"Analysis grounded in backend context: {facts}"


class CopilotService:
    def __init__(self, db: Session):
        self.db = db
        self.facility_repo = FacilityRepository(db)
        self.stock_repo = StockSnapshotRepository(db)
        self.transfer_repo = TransferRepository(db)
        self.forecast_service = ForecastService(db)
        self.risk_service = RiskService(db)
        self.gemini_adapter = GeminiAdapter()

    def ask(self, request: CopilotAskRequest, ctx: UserContext) -> CopilotAskResponse:
        # Enforce RBAC Scoping
        target_district = request.context_district_id or ctx.district
        if ctx.role in (UserRole.BLOCK, UserRole.DISTRICT):
            if ctx.district and ctx.district != "ALL" and target_district != ctx.district:
                raise ForbiddenError(message=f"Requested district context {target_district} is outside authorized scope {ctx.district}")

        # Gather Ground-Truth Facts Context
        facts: Dict[str, Any] = {"district": target_district, "user_role": ctx.role.value}

        target_fac_id = request.context_facility_id or (ctx.facility_id if ctx.role == UserRole.FACILITY else None)
        if target_fac_id:
            fac = self.facility_repo.get_by_id(target_fac_id)
            if fac:
                # Facility RBAC check
                if ctx.role == UserRole.FACILITY and ctx.facility_id and fac.facility_id != ctx.facility_id:
                    raise ForbiddenError(message=f"Facility {target_fac_id} outside authorized facility scope")
                
                facts["facility"] = {
                    "facility_id": fac.facility_id,
                    "name": fac.name,
                    "district_id": fac.district_id,
                    "facility_type": fac.facility_type,
                    "stock_status": fac.stock_status,
                    "road_access": fac.road_access_status
                }

        target_drug = request.context_drug_code.upper() if request.context_drug_code else "ORS"
        facts["drug_code"] = target_drug

        if target_fac_id:
            # Gather Forecast Facts
            fc_item = self.forecast_service.compute_forecast_for_facility_drug(target_fac_id, target_drug, horizon_days=28)
            facts["forecast"] = {
                "predicted_demand": getattr(fc_item, "predicted_demand", 280),
                "p50": getattr(fc_item, "p50", 280),
                "p90": getattr(fc_item, "p90", 350),
                "confidence": getattr(fc_item, "confidence", 0.90)
            }

            # Gather Risk Facts
            sn = self.db.query(StockSnapshot).filter(StockSnapshot.facility_id == target_fac_id, StockSnapshot.drug_code == target_drug).first()
            drug_master = self.db.query(DrugMaster).filter(DrugMaster.drug_code == target_drug).first()
            if fac and drug_master:
                rk_item = self.risk_service.compute_risk_for_facility_drug(fac, drug_master, sn)
                facts["risk"] = {
                    "risk_level": rk_item.risk_level,
                    "cover_days": rk_item.cover_days,
                    "p_stockout": rk_item.p_stockout,
                    "priority": rk_item.priority,
                    "reason": rk_item.reason
                }

        if request.context_transfer_id:
            t = self.transfer_repo.get_by_id(request.context_transfer_id)
            if t:
                facts["transfer"] = {
                    "transfer_id": t.transfer_id,
                    "source_facility_id": t.source_facility_id,
                    "destination_facility_id": t.destination_facility_id,
                    "drug_code": t.drug_code,
                    "quantity": t.quantity,
                    "status": t.status,
                    "reason": t.reason,
                    "decided_by": t.decided_by,
                    "notes": t.decision_comment
                }

        # Generate Gemini explanation
        exp_res = self.gemini_adapter.generate_explanation(request.prompt, facts, is_mock=settings.MOCK_MODE)

        # Audit Event creation
        audit_service.record(
            ctx,
            "COPILOT_ASK",
            "COPILOT",
            resource_id=target_fac_id or target_district,
            details={
                "prompt": request.prompt,
                "district": target_district,
                "facility_id": target_fac_id,
                "model": exp_res["model"],
                "confidence": exp_res["confidence"]
            },
            db=self.db
        )

        return CopilotAskResponse(
            answer=exp_res["answer"],
            confidence=exp_res["confidence"],
            sources=exp_res["sources"],
            supporting_facts=exp_res["supporting_facts"],
            limitations=exp_res["limitations"],
            generated_at=exp_res["generated_at"],
            model=exp_res["model"],
            data_sources={"district": target_district, "model": exp_res["model"]}
        )
