from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    FACILITY = "FACILITY"
    BLOCK = "BLOCK"
    DISTRICT = "DISTRICT"
    STATE = "STATE"
    AUDITOR = "AUDITOR"


class UserContext(BaseModel):
    user_id: str = Field(default="anonymous_user", description="Authenticated user identifier")
    role: UserRole = Field(default=UserRole.FACILITY, description="User role in the system")
    district: str = Field(default="TN-D01", description="District ID or ALL for STATE/AUDITOR")
    facility_id: Optional[str] = Field(default=None, description="Facility ID if applicable")
    block_id: Optional[str] = Field(default=None, description="Block ID if applicable")

    def is_state(self) -> bool:
        return self.role == UserRole.STATE

    def is_auditor(self) -> bool:
        return self.role == UserRole.AUDITOR

    def is_district(self) -> bool:
        return self.role == UserRole.DISTRICT

    def is_block(self) -> bool:
        return self.role == UserRole.BLOCK

    def is_facility(self) -> bool:
        return self.role == UserRole.FACILITY
