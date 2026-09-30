from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VoiceCaptureRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, description="Base64 encoded audio string")
    facility_id: str = Field(..., description="Target facility ID")


class PhotoCaptureRequest(BaseModel):
    image_base64: Optional[str] = Field(None, description="Base64 encoded image string")
    facility_id: str = Field(..., description="Target facility ID")


class CapturedStockItem(BaseModel):
    drug_id: str = Field(..., description="Drug code")
    quantity: int = Field(..., description="Quantity in base units")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score 0.0-1.0")


class CaptureResponse(BaseModel):
    capture_id: str = Field(..., description="Unique capture transaction ID")
    facility_id: str = Field(..., description="Target facility ID")
    extracted_items: List[CapturedStockItem] = Field(default_factory=list)
    raw_text: Optional[str] = Field(None, description="Transcribed audio text or OCR text")
    status: str = Field("PENDING_CONFIRMATION", description="Capture status")


class ConfirmCaptureRequest(BaseModel):
    capture_id: str = Field(..., description="Capture ID to confirm")
    items: List[CapturedStockItem] = Field(..., description="Confirmed stock items list")


class ConfirmCaptureResponse(BaseModel):
    capture_id: str = Field(...)
    status: str = Field("CONFIRMED")
    updated_items_count: int = Field(...)
