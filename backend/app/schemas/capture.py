from typing import Any, Dict, List, Optional
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class VoiceCaptureRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(..., description="Target facility ID")
    audio_base64: Optional[str] = Field(None, description="Base64 encoded audio string")
    language: Optional[str] = Field("en-IN", description="Language code")


class PhotoCaptureRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(..., description="Target facility ID")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image string")


class CapturedStockItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    drug_id: str = Field(..., validation_alias=AliasChoices("drug_id", "drug_code"), description="Drug code")
    quantity: int = Field(..., validation_alias=AliasChoices("quantity", "qty"), description="Quantity in base units")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score 0.0-1.0")


class CaptureRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    row_id: Optional[int] = Field(1)
    drug_heard: Optional[str] = Field(None)
    drug_code: Optional[str] = Field(None, validation_alias=AliasChoices("drug_code", "drug_id"))
    drug_name: Optional[str] = Field(None)
    qty: int = Field(..., validation_alias=AliasChoices("qty", "quantity"))
    unit: str = Field("unit")
    batch_no: Optional[str] = Field(None)
    expiry_date: Optional[str] = Field(None)
    confidence: float = Field(0.95, ge=0.0, le=1.0)
    needs_confirm: bool = Field(False)


class CaptureResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    capture_id: str = Field(..., description="Unique capture transaction ID")
    facility_id: str = Field(..., description="Target facility ID")
    source: str = Field("voice", description="Source type (voice / photo)")
    language: Optional[str] = Field(None)
    transcript: Optional[str] = Field(None)
    raw_text: Optional[str] = Field(None)
    confidence_threshold: float = Field(0.85)
    rows: List[CaptureRow] = Field(default_factory=list)
    extracted_items: Optional[List[Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    status: str = Field("PENDING_CONFIRMATION", description="Capture status")


class ConfirmedRow(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    drug_code: str = Field(..., validation_alias=AliasChoices("drug_code", "drug_id"))
    qty: int = Field(..., validation_alias=AliasChoices("qty", "quantity"))
    unit: str = Field("unit")
    batch_no: Optional[str] = Field(None)
    expiry_date: Optional[str] = Field(None)


class ConfirmCaptureRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    capture_id: str = Field(..., description="Capture ID to confirm")
    facility_id: Optional[str] = Field("FAC-001", description="Target facility ID")
    rows: List[ConfirmedRow] = Field(default_factory=list, validation_alias=AliasChoices("rows", "items"))
    items: Optional[List[CapturedStockItem]] = Field(None)


class StatusUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    drug_code: str = Field(...)
    status: str = Field(...)
    cover_days: float = Field(...)


class ConfirmCaptureResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    snapshot_id: Optional[str] = Field(None)
    capture_id: Optional[str] = Field(None)
    facility_id: Optional[str] = Field(None)
    recorded_at: Optional[str] = Field(None)
    rows_saved: int = Field(..., validation_alias=AliasChoices("rows_saved", "updated_items_count"))
    updated_items_count: Optional[int] = Field(None)
    updated_status: List[StatusUpdate] = Field(default_factory=list)
    status: str = Field("CONFIRMED")
