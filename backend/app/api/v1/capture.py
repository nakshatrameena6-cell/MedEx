from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, Request, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_context
from app.core.errors import PayloadTooLargeError, ValidationError, ForbiddenError
from app.core.roles import UserContext
from app.core.security import check_capture_access
from app.db.database import get_db
from app.schemas.capture import (
    VoiceCaptureRequest, PhotoCaptureRequest, ConfirmCaptureRequest,
    CaptureResponse, ConfirmCaptureResponse
)
from app.services.capture import CaptureService

router = APIRouter(prefix="/capture", tags=["Capture"])


@router.post("/voice", response_model=CaptureResponse, summary="Voice Stock Capture")
async def capture_voice(
    request: Request,
    audio: Optional[UploadFile] = File(None),
    facility_id: Optional[str] = Form(None),
    language: Optional[str] = Form("en-IN"),
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user_context)
):
    check_capture_access(ctx)
    service = CaptureService(db)

    # Check if request content-type is multipart or json
    content_type = request.headers.get("content-type", "")

    audio_bytes = None
    target_facility_id = facility_id
    target_language = language

    if "multipart/form-data" in content_type:
        if audio:
            # 10 MB max size check
            audio_bytes = await audio.read()
            if len(audio_bytes) > 10 * 1024 * 1024:
                raise PayloadTooLargeError(message="Audio file is too large. Max allowed size is 10 MB.")
        if not target_facility_id:
            raise ValidationError(message="facility_id is required for voice capture")
    else:
        # Try JSON body
        try:
            json_body = await request.json()
            body_obj = VoiceCaptureRequest(**json_body)
            target_facility_id = body_obj.facility_id
            target_language = body_obj.language
        except Exception:
            if not target_facility_id:
                raise ValidationError(message="facility_id is required for voice capture")

    return service.process_voice_capture(
        facility_id=target_facility_id,
        audio_bytes=audio_bytes,
        language=target_language,
        ctx=ctx
    )


@router.post("/photo", response_model=CaptureResponse, summary="Photo Stock Capture")
async def capture_photo(
    request: Request,
    image: Optional[UploadFile] = File(None),
    facility_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user_context)
):
    check_capture_access(ctx)
    service = CaptureService(db)

    content_type = request.headers.get("content-type", "")

    image_bytes = None
    target_facility_id = facility_id

    if "multipart/form-data" in content_type:
        if image:
            # 8 MB max size check
            image_bytes = await image.read()
            if len(image_bytes) > 8 * 1024 * 1024:
                raise PayloadTooLargeError(message="Image file is too large. Max allowed size is 8 MB.")
        if not target_facility_id:
            raise ValidationError(message="facility_id is required for photo capture")
    else:
        try:
            json_body = await request.json()
            body_obj = PhotoCaptureRequest(**json_body)
            target_facility_id = body_obj.facility_id
        except Exception:
            if not target_facility_id:
                raise ValidationError(message="facility_id is required for photo capture")

    return service.process_photo_capture(
        facility_id=target_facility_id,
        image_bytes=image_bytes,
        ctx=ctx
    )


@router.post("/confirm", response_model=ConfirmCaptureResponse, summary="Confirm Stock Capture")
def capture_confirm(
    body: ConfirmCaptureRequest,
    db: Session = Depends(get_db),
    ctx: UserContext = Depends(get_current_user_context)
):
    check_capture_access(ctx)
    service = CaptureService(db)
    return service.confirm_capture(body, ctx)
