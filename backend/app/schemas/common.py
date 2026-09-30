from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ErrorDetails(BaseModel):
    pass


class ErrorPayload(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable explanation")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured validation or context information")


class ErrorResponse(BaseModel):
    error: ErrorPayload


class FeatureNotReadyResponse(BaseModel):
    error: ErrorPayload = Field(
        default_factory=lambda: ErrorPayload(
            code="FEATURE_NOT_READY",
            message="This capability is not implemented in the current backend phase.",
            details={}
        )
    )
