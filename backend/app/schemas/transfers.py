from typing import List, Optional
from pydantic import BaseModel, Field


class TransferItem(BaseModel):
    transfer_id: str = Field(...)
    source_facility_id: str = Field(...)
    destination_facility_id: str = Field(...)
    drug_id: str = Field(...)
    quantity: int = Field(...)
    status: str = Field("PENDING", description="PENDING, APPROVED, REJECTED, COMPLETED")
    created_at: str = Field(..., description="ISO-8601 UTC timestamp")


class TransfersResponse(BaseModel):
    transfers: List[TransferItem] = Field(default_factory=list)


class TransferDecisionRequest(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = Field(None, description="Optional decision notes")


class TransferDecisionResponse(BaseModel):
    transfer_id: str = Field(...)
    status: str = Field(...)
    decided_by: str = Field(...)
    timestamp: str = Field(...)
