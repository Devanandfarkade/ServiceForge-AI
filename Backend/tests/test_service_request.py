"""
ServiceForge AI — Unit Tests: Service Request Lambda Handler
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from functions.service_request.handler import lambda_handler

MOCK_EVENT_CONTEXT = {
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "user-manager-001",
                "custom:org_id": "org-8841-alpha",
                "custom:role": "SERVICE_MANAGER"
            }
        }
    }
}

def test_create_service_request_success():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/service-requests",
        "body": json.dumps({
            "description": "Industrial compressor producing loud grinding noise and shutting down.",
            "descriptionSource": "edited_voice",
            "priority": "HIGH",
            "attachments": ["att-001"]
        })
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 201
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert body["data"]["description"] == "Industrial compressor producing loud grinding noise and shutting down."
    assert body["data"]["descriptionSource"] == "edited_voice"
    assert body["data"]["organizationId"] == "org-8841-alpha"

def test_list_service_requests_tenant_isolated():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "GET",
        "path": "/service-requests"
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert isinstance(body["data"], list)

def test_ai_analyze_placeholder_boundary():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/service-requests/req-9988-test/analyze",
        "pathParameters": {"id": "req-9988-test"}
    }
    # Create request item first in mock store
    from shared.dynamodb import db_client
    from shared.models import build_service_request_item
    req_item = build_service_request_item(
        org_id="org-8841-alpha",
        user_id="user-manager-001",
        description="Test issue",
        description_source="typed",
        request_id="req-9988-test"
    )
    db_client.put_item(req_item)

    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert body["data"]["status"] == "ai_placeholder"
    assert "not connected in Phase 1" in body["data"]["message"]
