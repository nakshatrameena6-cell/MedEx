from typing import Optional
from fastapi import Header
from app.core.errors import InvalidHeaderError
from app.core.roles import UserContext, UserRole


def get_current_user_context(
    x_role: Optional[str] = Header(None, alias="X-Role"),
    x_district: Optional[str] = Header(None, alias="X-District"),
    x_user: Optional[str] = Header(None, alias="X-User")
) -> UserContext:
    role_enum = UserRole.FACILITY
    if x_role is not None:
        raw_role = x_role.strip().upper()
        try:
            role_enum = UserRole(raw_role)
        except ValueError:
            raise InvalidHeaderError(
                message=f"Invalid X-Role header value: '{x_role}'. Allowed values: {[r.value for r in UserRole]}"
            )

    user_id = x_user.strip() if x_user and x_user.strip() else "anonymous_user"

    if role_enum in (UserRole.STATE, UserRole.AUDITOR):
        district = "ALL"
    else:
        district = x_district.strip() if x_district and x_district.strip() else "TN-D01"

    return UserContext(
        user_id=user_id,
        role=role_enum,
        district=district
    )
