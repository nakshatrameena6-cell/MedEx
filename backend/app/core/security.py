from app.core.errors import ForbiddenError
from app.core.roles import UserContext, UserRole


def check_read_access(ctx: UserContext) -> None:
    # All roles (FACILITY, BLOCK, DISTRICT, STATE, AUDITOR) have read access (scoped to their level)
    return


def check_capture_access(ctx: UserContext) -> None:
    if ctx.role == UserRole.AUDITOR:
        raise ForbiddenError("AUDITOR role is forbidden from performing capture operations")


def check_optimize_access(ctx: UserContext) -> None:
    if ctx.role in (UserRole.FACILITY, UserRole.AUDITOR):
        raise ForbiddenError(f"{ctx.role.value} role is forbidden from triggering optimization")


def check_transfer_decision_access(ctx: UserContext) -> None:
    if ctx.role in (UserRole.FACILITY, UserRole.AUDITOR):
        raise ForbiddenError(f"{ctx.role.value} role is forbidden from making transfer decisions")


def check_copilot_access(ctx: UserContext) -> None:
    # All roles allowed
    return


def check_scenario_access(ctx: UserContext) -> None:
    if ctx.role in (UserRole.FACILITY, UserRole.BLOCK, UserRole.AUDITOR):
        raise ForbiddenError(f"{ctx.role.value} role is forbidden from running scenarios")


def check_federation_round_access(ctx: UserContext) -> None:
    if ctx.role != UserRole.STATE:
        raise ForbiddenError("Only STATE role is permitted to execute federation rounds")


def check_federation_history_access(ctx: UserContext) -> None:
    if ctx.role not in (UserRole.STATE, UserRole.AUDITOR):
        raise ForbiddenError(f"{ctx.role.value} role is forbidden from viewing federation round history")


def check_audit_access(ctx: UserContext) -> None:
    if ctx.role not in (UserRole.DISTRICT, UserRole.STATE, UserRole.AUDITOR):
        raise ForbiddenError(f"{ctx.role.value} role is forbidden from viewing audit logs")
