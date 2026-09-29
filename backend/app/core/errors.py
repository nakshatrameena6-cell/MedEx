from typing import Any, Dict, Optional
from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details
            }
        }


class InvalidHeaderError(AppException):
    def __init__(self, message: str = "Invalid headers provided", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=400, code="INVALID_HEADER", message=message, details=details)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Access forbidden for this role", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=403, code="FORBIDDEN", message=message, details=details)


class NotFoundError(AppException):
    def __init__(self, message: str = "Requested resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=404, code="NOT_FOUND", message=message, details=details)


class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=409, code="CONFLICT", message=message, details=details)


class PayloadTooLargeError(AppException):
    def __init__(self, message: str = "Request payload too large", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=413, code="PAYLOAD_TOO_LARGE", message=message, details=details)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=422, code="VALIDATION_ERROR", message=message, details=details)


class InternalServerError(AppException):
    def __init__(self, message: str = "An unexpected server error occurred", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=500, code="INTERNAL_SERVER_ERROR", message=message, details=details)


class BadGatewayError(AppException):
    def __init__(self, message: str = "External dependency failure", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=502, code="BAD_GATEWAY", message=message, details=details)


class FeatureNotReadyError(AppException):
    def __init__(self, message: str = "This capability is not implemented in the current backend phase.", details: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=501, code="FEATURE_NOT_READY", message=message, details=details)
