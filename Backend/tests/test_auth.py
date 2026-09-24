"""
ServiceForge AI — Unit Tests: Authentication & Tenant Isolation Context
"""

import sys
import os
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.errors import AuthenticationError, AuthorizationError

def test_extract_user_context_cognito_claims():
    event = {
        "requestContext": {
            "authorizer": {
                "claims": {
                    "sub": "user-123-uuid",
                    "email": "technician@apexmfg.com",
                    "name": "Sarah Miller",
                    "custom:role": "TECHNICIAN",
                    "custom:org_id": "org-9988-beta"
                }
            }
        }
    }
    ctx = extract_user_context(event)
    assert ctx["userId"] == "user-123-uuid"
    assert ctx["organizationId"] == "org-9988-beta"
    assert ctx["role"] == "TECHNICIAN"

def test_extract_user_context_invalid_role():
    event = {
        "requestContext": {
            "authorizer": {
                "claims": {
                    "sub": "user-123-uuid",
                    "custom:role": "SUPERADMIN_INVALID",
                    "custom:org_id": "org-9988-beta"
                }
            }
        }
    }
    with pytest.raises(AuthenticationError):
        extract_user_context(event)

def test_require_role_success():
    ctx = {"role": "SERVICE_MANAGER", "organizationId": "org-8841-alpha"}
    # Should not raise exception
    require_role(ctx, ["ADMIN", "SERVICE_MANAGER"])

def test_require_role_forbidden():
    ctx = {"role": "CUSTOMER", "organizationId": "org-8841-alpha"}
    with pytest.raises(AuthorizationError):
        require_role(ctx, ["ADMIN", "SERVICE_MANAGER"])

def test_verify_tenant_access_same_org():
    ctx = {"organizationId": "org-8841-alpha"}
    # Should pass without error
    verify_tenant_access(ctx, "org-8841-alpha")

def test_verify_tenant_access_cross_tenant_denied():
    ctx = {"organizationId": "org-8841-alpha"}
    with pytest.raises(AuthorizationError):
        verify_tenant_access(ctx, "org-different-beta")
