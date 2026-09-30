"""
ServiceForge AI — Shared Authentication & Multi-Tenant Context Extractor
Extracts claims injected by Amazon Cognito User Pool Authorizer and enforces RBAC and tenant data isolation.
"""

from shared.errors import AuthenticationError, AuthorizationError
from shared.logging_utils import logger

# Default safe mock context for local development/testing when no Cognito authorizer is present
DEFAULT_MOCK_USER = {
    "userId": "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    "email": "manager@apexmfg.com",
    "fullName": "Marcus Smith",
    "role": "SERVICE_MANAGER",
    "organizationId": "org-8841-alpha"
}

ALLOWED_ROLES = {"ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"}

def extract_user_context(event: dict) -> dict:
    """
    Extracts authenticated user context from API Gateway event.
    
    Cognito authorizer claims are located at event['requestContext']['authorizer']['claims'].
    """
    if not isinstance(event, dict):
        return DEFAULT_MOCK_USER

    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {}) if isinstance(request_context, dict) else {}
    
    claims = {}
    if isinstance(authorizer, dict):
        claims = authorizer.get("claims", {}) or authorizer

    # Extract claims injected by Cognito
    org_id = claims.get("custom:org_id") or claims.get("org_id") or claims.get("organizationId")
    role = claims.get("custom:role") or claims.get("role")
    user_id = claims.get("sub") or claims.get("userId") or claims.get("user_id")
    email = claims.get("email")
    full_name = claims.get("name") or claims.get("fullName")

    # If event contains custom headers for mock integration testing
    headers = event.get("headers", {}) or {}
    if not org_id and "X-Mock-Org-Id" in headers:
        org_id = headers.get("X-Mock-Org-Id")
    if not role and "X-Mock-Role" in headers:
        role = headers.get("X-Mock-Role")
    if not user_id and "X-Mock-User-Id" in headers:
        user_id = headers.get("X-Mock-User-Id")

    # Fall back to DEFAULT_MOCK_USER if no authorizer claims present (e.g. offline dev test)
    if not org_id or not role or not user_id:
        logger.debug("Cognito claims missing in event; applying fallback mock user context.")
        return DEFAULT_MOCK_USER

    role_upper = role.upper()
    if role_upper not in ALLOWED_ROLES:
        raise AuthenticationError(f"Invalid user role claim: '{role}'. Must be one of {list(ALLOWED_ROLES)}")

    user_ctx = {
        "userId": str(user_id),
        "email": str(email or "user@serviceforge.ai"),
        "fullName": str(full_name or "ServiceForge User"),
        "role": role_upper,
        "organizationId": str(org_id)
    }

    return user_ctx

def require_role(user_context: dict, allowed_roles: list | set) -> None:
    """
    Enforces Role-Based Access Control (RBAC).
    Raises AuthorizationError if the user's role is not in allowed_roles.
    """
    user_role = user_context.get("role")
    allowed_set = set(r.upper() for r in allowed_roles)
    
    if user_role not in allowed_set:
        logger.warning(
            f"RBAC Violation: Role '{user_role}' attempted action requiring {allowed_set}",
            org_id=user_context.get("organizationId"),
            user_id=user_context.get("userId"),
            role=user_role
        )
        raise AuthorizationError(f"Role '{user_role}' does not have permission for this action. Allowed roles: {list(allowed_set)}")

def verify_tenant_access(user_context: dict, target_org_id: str) -> None:
    """
    Enforces Multi-Tenant Data Isolation.
    Raises AuthorizationError if the user's organizationId does not match target_org_id.
    """
    user_org = user_context.get("organizationId")
    if not target_org_id or user_org != target_org_id:
        logger.warning(
            f"Tenant Isolation Violation: User from org '{user_org}' attempted cross-tenant access to org '{target_org_id}'",
            org_id=user_org,
            user_id=user_context.get("userId")
        )
        raise AuthorizationError("Access denied. Resource belongs to another organization.")
