from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_context
from app.core.roles import UserContext
from app.core.security import check_capture_access
from app.schemas.capture import (
    VoiceCaptureRequest, PhotoCaptureRequest, ConfirmCaptureRequest,
    CaptureResponse, ConfirmCaptureResponse, CapturedStockItem
)
from app.services.audit import audit_service

router = APIRouter(prefix="/capture", tags=["Capture"])


@router.post("/voice", response_model=CaptureResponse, summary="Voice Stock Capture")
def capture_voice(
    body: VoiceCaptureRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_capture_access(ctx)
    audit_service.record(ctx, "VOICE_CAPTURE", "facility", body.facility_id)
    return CaptureResponse(
        capture_id="CAP-V-001",
        facility_id=body.facility_id,
        extracted_items=[
            CapturedStockItem(drug_id="ORS", quantity=300, confidence=0.95),
            CapturedStockItem(drug_id="PARACETAMOL", quantity=150, confidence=0.88)
        ],
        raw_text="300 sachets of ORS and 150 tablets of Paracetamol available",
        status="PENDING_CONFIRMATION"
    )


@router.post("/photo", response_model=CaptureResponse, summary="Photo Stock Capture")
def capture_photo(
    body: PhotoCaptureRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_capture_access(ctx)
    audit_service.record(ctx, "PHOTO_CAPTURE", "facility", body.facility_id)
    return CaptureResponse(
        capture_id="CAP-P-001",
        facility_id=body.facility_id,
        extracted_items=[
            CapturedStockItem(drug_id="ORS", quantity=500, confidence=0.92)
        ],
        raw_text="OCR extracted stock register image",
        status="PENDING_CONFIRMATION"
    )


@router.post("/confirm", response_model=ConfirmCaptureResponse, summary="Confirm Stock Capture")
def capture_confirm(
    body: ConfirmCaptureRequest,
    ctx: UserContext = Depends(get_current_user_context)
):
    check_capture_access(ctx)
    audit_service.record(ctx, "CONFIRM_CAPTURE", "capture", body.capture_id)
    return ConfirmCaptureResponse(
        capture_id=body.capture_id,
        status="CONFIRMED",
        updated_items_count=len(body.items)
    )
