"""
ServiceForge AI — Unit Tests: Service Request Lambda Handler
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

try:
    from functions.service_request.handler import lambda_handler
except ModuleNotFoundError:
    import importlib.util
    handler_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../functions/service-request/handler.py'))
    spec = importlib.util.spec_from_file_location("functions.service_request.handler", handler_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    lambda_handler = mod.lambda_handler


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

def test_ai_analyze_real_bedrock_integration():
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
        description="Industrial compressor producing loud grinding noise and shutting down.",
        description_source="edited_voice",
        request_id="req-9988-test"
    )
    db_client.put_item(req_item)

    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True

    # Verify structured AI output schema
    data = body["data"]
    assert "summary" in data
    assert "detectedAssetCategory" in data
    assert "symptoms" in data
    assert "suggestedInspectionSteps" in data
    assert "suggestedTools" in data
    assert "suggestedParts" in data
    assert "safetyConsiderations" in data
    assert "confidenceScore" in data
    assert data["humanReviewRequired"] is True

    # Verify updated request status in DynamoDB
    updated_req = db_client.get_item("ORG#org-8841-alpha", "REQ#req-9988-test")
    assert updated_req["status"] == "PENDING_REVIEW"

    # Verify AIAnalysis audit log saved to DynamoDB
    ai_audit = db_client.get_item("ORG#org-8841-alpha", "AI_ANALYSIS#req-9988-test")
    assert ai_audit is not None
    assert ai_audit["requestId"] == "req-9988-test"
    assert ai_audit["reviewStatus"] == "PENDING_REVIEW"

def test_ai_analyze_failure_does_not_update_status_to_pending_review():
    from shared.dynamodb import db_client
    from shared.models import build_service_request_item
    from shared.bedrock import bedrock_client
    from unittest.mock import MagicMock

    req_item = build_service_request_item(
        org_id="org-8841-alpha",
        user_id="user-manager-001",
        description="Pneumatic leak in assembly line 4.",
        description_source="typed",
        request_id="req-fail-status-check"
    )
    db_client.put_item(req_item)

    mock_client = MagicMock()
    mock_client.invoke_model.side_effect = Exception("ServiceUnavailableException")

    orig_client = bedrock_client.client
    orig_use_mock = bedrock_client.use_mock

    bedrock_client.client = mock_client
    bedrock_client.use_mock = False

    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/service-requests/req-fail-status-check/analyze",
        "pathParameters": {"id": "req-fail-status-check"}
    }

    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 502
    body = json.loads(resp["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "BEDROCK_SERVICE_ERROR"

    # Status must NOT be PENDING_REVIEW
    current_req = db_client.get_item("ORG#org-8841-alpha", "REQ#req-fail-status-check")
    assert current_req["status"] == "SUBMITTED"

    bedrock_client.client = orig_client
    bedrock_client.use_mock = orig_use_mock


