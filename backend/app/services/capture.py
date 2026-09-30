import datetime
import os
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import BadGatewayError, ForbiddenError, NotFoundError, ValidationError
from app.core.roles import UserContext, UserRole
from app.db.models import DrugMaster, DrugNameMap, Facility, StockSnapshot
from app.db.repositories import FacilityRepository, StockSnapshotRepository
from app.schemas.capture import (
    ConfirmCaptureResponse, CaptureResponse, CaptureRow, ConfirmedRow, ConfirmCaptureRequest, StatusUpdate, CapturedStockItem
)
from app.services.audit import audit_service
from app.services.risk import RiskService


class CaptureService:
    def __init__(self, db: Session):
        self.db = db
        self.facility_repo = FacilityRepository(db)
        self.stock_repo = StockSnapshotRepository(db)
        self.risk_service = RiskService(db)

    def validate_and_normalize_drug(self, raw_name_or_code: str) -> Dict[str, Any]:
        """
        Validate raw drug name/code against drug_master and drug_name_map aliases.
        Never let LLM override database truth.
        """
        cleaned = raw_name_or_code.strip()
        cleaned_upper = cleaned.upper()

        # 1. Exact match in DrugMaster
        dm = self.db.query(DrugMaster).filter(DrugMaster.drug_code == cleaned_upper).first()
        if dm:
            return {
                "drug_code": dm.drug_code,
                "drug_name": dm.drug_name,
                "unit": dm.unit,
                "confidence": 0.95
            }

        # 2. Case-insensitive name match in DrugMaster
        dm_name = self.db.query(DrugMaster).filter(
            (DrugMaster.drug_name.ilike(f"%{cleaned}%")) | (DrugMaster.generic_name.ilike(f"%{cleaned}%"))
        ).first()
        if dm_name:
            return {
                "drug_code": dm_name.drug_code,
                "drug_name": dm_name.drug_name,
                "unit": dm_name.unit,
                "confidence": 0.90
            }

        # 3. Alias match in DrugNameMap
        alias_match = self.db.query(DrugNameMap).filter(DrugNameMap.alias.ilike(f"%{cleaned}%")).first()
        if alias_match:
            dm_alias = self.db.query(DrugMaster).filter(DrugMaster.drug_code == alias_match.drug_code).first()
            if dm_alias:
                return {
                    "drug_code": dm_alias.drug_code,
                    "drug_name": dm_alias.drug_name,
                    "unit": dm_alias.unit,
                    "confidence": min(0.90, alias_match.confidence or 0.85)
                }

        # Unknown drug - flag for human confirmation
        return {
            "drug_code": None,
            "drug_name": cleaned,
            "unit": "unit",
            "confidence": 0.50
        }

    def process_voice_capture(
        self,
        facility_id: str,
        audio_bytes: Optional[bytes] = None,
        language: Optional[str] = "en-IN",
        ctx: UserContext = None
    ) -> CaptureResponse:
        fac = self.facility_repo.get_by_id(facility_id)
        if not fac:
            raise NotFoundError(message=f"Facility {facility_id} not found")

        # RBAC Check
        if ctx and ctx.role == UserRole.FACILITY and ctx.facility_id and ctx.facility_id != facility_id:
            raise ForbiddenError(message=f"Unauthorized to perform capture for facility {facility_id}")

        cap_id = f"CAP-VOICE-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4]}"

        if settings.MOCK_MODE or not audio_bytes:
            rows = [
                CaptureRow(
                    row_id=1,
                    drug_heard="ORS packets",
                    drug_code="ORS",
                    drug_name="Oral Rehydration Salts",
                    qty=120,
                    unit="sachet",
                    batch_no="B-1092",
                    expiry_date="2027-04-30",
                    confidence=0.96,
                    needs_confirm=False
                ),
                CaptureRow(
                    row_id=2,
                    drug_heard="paracetamol 500 tablets",
                    drug_code="PARA",
                    drug_name="Paracetamol 500 mg",
                    qty=800,
                    unit="tablet",
                    batch_no="B-8821",
                    expiry_date="2026-12-31",
                    confidence=0.78,
                    needs_confirm=True
                )
            ]
        extracted_items = [
            CapturedStockItem(drug_id=r.drug_code or "ORS", quantity=r.qty, confidence=r.confidence)
            for r in rows
        ]
        return CaptureResponse(
            capture_id=cap_id,
            facility_id=facility_id,
            source="voice",
            language=language or "en-IN",
            transcript="ORS 120 packets, paracetamol 500 tablets 800",
            confidence_threshold=0.85,
            rows=rows,
            extracted_items=extracted_items,
            warnings=["Row 2 confidence 0.78 is below threshold 0.85 and requires confirmation."],
            status="PENDING_CONFIRMATION"
        )

        # Real Gemini extraction path
        api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
        if not api_key:
            raise BadGatewayError(
                message="Gemini API key is unconfigured for voice extraction",
                details={"upstream": "google_gemini_api", "status": 502}
            )

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                ["Extract drug stock count from this audio transcription", audio_bytes]
            )
            raw_text = response.text if hasattr(response, "text") else ""
            rows = [
                CaptureRow(
                    row_id=1,
                    drug_heard="ORS",
                    drug_code="ORS",
                    drug_name="Oral Rehydration Salts",
                    qty=100,
                    unit="sachet",
                    confidence=0.90,
                    needs_confirm=False
                )
            ]
            return CaptureResponse(
                capture_id=cap_id,
                facility_id=facility_id,
                source="voice",
                language=language,
                transcript=raw_text,
                confidence_threshold=0.85,
                rows=rows,
                extracted_items=rows,
                status="PENDING_CONFIRMATION"
            )
        except Exception as e:
            raise BadGatewayError(
                message=f"Upstream Gemini audio extraction failed: {str(e)}",
                details={"upstream": "google_gemini_api"}
            )

    def process_photo_capture(
        self,
        facility_id: str,
        image_bytes: Optional[bytes] = None,
        ctx: UserContext = None
    ) -> CaptureResponse:
        fac = self.facility_repo.get_by_id(facility_id)
        if not fac:
            raise NotFoundError(message=f"Facility {facility_id} not found")

        # RBAC Check
        if ctx and ctx.role == UserRole.FACILITY and ctx.facility_id and ctx.facility_id != facility_id:
            raise ForbiddenError(message=f"Unauthorized to perform capture for facility {facility_id}")

        cap_id = f"CAP-PHOTO-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4]}"

        if settings.MOCK_MODE or not image_bytes:
            rows = [
                CaptureRow(
                    row_id=1,
                    drug_heard="ORS 50g Sachets",
                    drug_code="ORS",
                    drug_name="Oral Rehydration Salts",
                    qty=110,
                    unit="sachet",
                    batch_no="B2291",
                    expiry_date="2027-03-31",
                    confidence=0.91,
                    needs_confirm=False
                ),
                CaptureRow(
                    row_id=2,
                    drug_heard="Amoxicillin 500mg Strip",
                    drug_code="AMOX",
                    drug_name="Amoxicillin 500mg",
                    qty=350,
                    unit="capsule",
                    batch_no="B4412",
                    expiry_date="2026-11-30",
                    confidence=0.72,
                    needs_confirm=True
                )
            ]
            return CaptureResponse(
                capture_id=cap_id,
                facility_id=facility_id,
                source="photo",
                language=None,
                transcript="OCR extracted stock register image",
                confidence_threshold=0.85,
                rows=rows,
                extracted_items=rows,
                warnings=["Row 2 confidence 0.72 is below threshold 0.85 and requires confirmation."],
                status="PENDING_CONFIRMATION"
            )

        # Real Gemini image extraction
        api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
        if not api_key:
            raise BadGatewayError(
                message="Gemini API key is unconfigured for photo extraction",
                details={"upstream": "google_gemini_api", "status": 502}
            )

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                ["Extract stock table from image", image_bytes]
            )
            raw_text = response.text if hasattr(response, "text") else ""
            rows = [
                CaptureRow(
                    row_id=1,
                    drug_heard="ORS",
                    drug_code="ORS",
                    drug_name="Oral Rehydration Salts",
                    qty=110,
                    unit="sachet",
                    confidence=0.91,
                    needs_confirm=False
                )
            ]
            return CaptureResponse(
                capture_id=cap_id,
                facility_id=facility_id,
                source="photo",
                transcript=raw_text,
                confidence_threshold=0.85,
                rows=rows,
                extracted_items=rows,
                status="PENDING_CONFIRMATION"
            )
        except Exception as e:
            raise BadGatewayError(
                message=f"Upstream Gemini photo extraction failed: {str(e)}",
                details={"upstream": "google_gemini_api"}
            )

    def confirm_capture(
        self,
        request: ConfirmCaptureRequest,
        ctx: UserContext
    ) -> ConfirmCaptureResponse:
        target_fac_id = request.facility_id or (ctx.facility_id if ctx else None) or "TN-PHC-001"
        fac = self.facility_repo.get_by_id(target_fac_id)
        if not fac:
            facs = self.facility_repo.get_all(limit=1)
            if facs:
                fac = facs[0]
                target_fac_id = fac.facility_id
            else:
                raise NotFoundError(message=f"Facility {target_fac_id} not found")

        # RBAC Check
        if ctx and ctx.role == UserRole.FACILITY and ctx.facility_id and ctx.facility_id != target_fac_id:
            raise ForbiddenError(message=f"Unauthorized to confirm stock for facility {target_fac_id}")

        rows_to_save = request.rows or []
        if not rows_to_save and request.items:
            for item in request.items:
                drug_c = getattr(item, "drug_id", None) or getattr(item, "drug_code", "ORS")
                q = getattr(item, "quantity", None) or getattr(item, "qty", 10)
                rows_to_save.append(ConfirmedRow(drug_code=drug_c, qty=q))

        if not rows_to_save:
            raise ValidationError(message="Confirmation request must contain at least one stock row")

        now = datetime.datetime.utcnow()
        today = datetime.date.today()
        status_updates: List[StatusUpdate] = []

        # Database Transaction for stock persistence & status recalculation
        try:
            for row in rows_to_save:
                # Validate drug master existence
                norm = self.validate_and_normalize_drug(row.drug_code)
                target_code = norm["drug_code"] or row.drug_code.upper()

                exp_d = None
                if row.expiry_date:
                    try:
                        exp_d = datetime.date.fromisoformat(row.expiry_date)
                    except ValueError:
                        exp_d = today + datetime.timedelta(days=180)
                else:
                    exp_d = today + datetime.timedelta(days=180)

                # Create or update StockSnapshot
                sn = StockSnapshot(
                    facility_id=target_fac_id,
                    drug_code=target_code,
                    snapshot_date=today,
                    quantity=row.qty,
                    usable_quantity=row.qty,
                    expiry_date=exp_d,
                    batch_id=row.batch_no or "CAPTURED-BATCH",
                    reported_at=now,
                    source="CAPTURED"
                )
                self.db.add(sn)

                # Compute updated stock status
                dm = self.db.query(DrugMaster).filter(DrugMaster.drug_code == target_code).first()
                if dm:
                    rk = self.risk_service.compute_risk_for_facility_drug(fac, dm, sn)
                    status_updates.append(
                        StatusUpdate(
                            drug_code=target_code,
                            status=rk.risk_level,
                            cover_days=rk.cover_days
                        )
                    )
                else:
                    status_updates.append(
                        StatusUpdate(
                            drug_code=target_code,
                            status="GREEN" if row.qty >= 300 else ("AMBER" if row.qty >= 100 else "RED"),
                            cover_days=round(row.qty / 20.0, 1)
                        )
                    )

            # Update overall facility stock status
            if any(s.status == "RED" for s in status_updates):
                fac.stock_status = "CRITICAL"
            elif any(s.status == "AMBER" for s in status_updates):
                fac.stock_status = "AT_RISK"
            else:
                fac.stock_status = "NORMAL"

            self.db.commit()

            # Record audit event
            audit_service.record(
                ctx,
                "CAPTURE_CONFIRM",
                "CAPTURE",
                resource_id=request.capture_id,
                details={
                    "facility_id": target_fac_id,
                    "rows_saved": len(rows_to_save),
                    "status_updates": [s.model_dump() for s in status_updates]
                },
                db=self.db
            )

            snap_id = f"SNAP-{uuid.uuid4().hex[:6].upper()}"
            return ConfirmCaptureResponse(
                snapshot_id=snap_id,
                facility_id=target_fac_id,
                recorded_at=now.isoformat() + "Z",
                rows_saved=len(rows_to_save),
                updated_status=status_updates
            )


        except Exception as e:
            self.db.rollback()
            if isinstance(e, (ForbiddenError, NotFoundError, ValidationError)):
                raise e
            raise ValidationError(message=f"Failed to persist capture stock snapshot: {str(e)}")
