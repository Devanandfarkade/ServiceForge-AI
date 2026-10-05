"""
ServiceForge AI — Unit Tests: User Profile Lambda Handler
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

try:
    from functions.profile.handler import lambda_handler
except ModuleNotFoundError:
    import importlib.util
    handler_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../functions/profile/handler.py'))
    spec = importlib.util.spec_from_file_location("functions.profile.handler", handler_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    lambda_handler = mod.lambda_handler

MOCK_EVENT_CONTEXT = {
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "user-manager-001",
                "custom:org_id": "org-8841-alpha",
                "custom:role": "SERVICE_MANAGER",
                "email": "marcus.smith@apexglobal.com"
            }
        }
    }
}

def test_get_user_profile_success():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "GET",
        "path": "/user/profile"
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert body["data"]["userId"] == "user-manager-001"
    assert body["data"]["organizationId"] == "org-8841-alpha"
    assert body["data"]["email"] == "marcus.smith@apexglobal.com"
    assert body["data"]["role"] == "SERVICE_MANAGER"

def test_patch_user_profile_success():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "PATCH",
        "path": "/user/profile",
        "body": json.dumps({
            "firstName": "Marcus",
            "lastName": "Sterling",
            "phone": "+1 (555) 999-8888",
            "department": "Senior Field Operations"
        })
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert body["data"]["firstName"] == "Marcus"
    assert body["data"]["lastName"] == "Sterling"
    assert body["data"]["fullName"] == "Marcus Sterling"
    assert body["data"]["phone"] == "+1 (555) 999-8888"
    assert body["data"]["department"] == "Senior Field Operations"

def test_patch_user_profile_invalid_field_fails():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "PATCH",
        "path": "/user/profile",
        "body": json.dumps({
            "role": "ADMIN",  # Unsupported role edit
            "invalidField": "malicious_payload"
        })
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_INPUT"
