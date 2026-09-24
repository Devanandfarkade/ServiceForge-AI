"""
ServiceForge AI — Unit Tests: Service Job Lambda Handler
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from functions.service_job.handler import lambda_handler

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

def test_create_and_assign_service_job():
    # 1. Create job
    create_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/service-jobs",
        "body": json.dumps({
            "requestId": "req-100",
            "title": "AC-4500 Compressor Noise Inspection",
            "priority": "HIGH"
        })
    }
    resp1 = lambda_handler(create_event, None)
    assert resp1["statusCode"] == 201
    body1 = json.loads(resp1["body"])
    job_id = body1["data"]["jobId"]
    assert body1["data"]["status"] == "UNASSIGNED"

    # 2. Assign technician
    assign_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": f"/service-jobs/{job_id}/assign",
        "pathParameters": {"id": job_id},
        "body": json.dumps({
            "technicianId": "tech-101",
            "scheduledStartTime": "2026-09-24T12:00:00Z"
        })
    }
    resp2 = lambda_handler(assign_event, None)
    assert resp2["statusCode"] == 200
    body2 = json.loads(resp2["body"])
    assert body2["data"]["status"] == "PENDING"
    assert body2["data"]["technicianId"] == "tech-101"

def test_invalid_status_transition_conflict():
    # Create job
    create_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/service-jobs",
        "body": json.dumps({
            "title": "Test Job for Conflict",
            "priority": "LOW"
        })
    }
    resp1 = lambda_handler(create_event, None)
    job_id = json.loads(resp1["body"])["data"]["jobId"]

    # Mark completed
    complete_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": f"/service-jobs/{job_id}/complete",
        "pathParameters": {"id": job_id}
    }
    lambda_handler(complete_event, None)

    # Now attempt invalid transition back to ASSIGNED (COMPLETED -> ASSIGNED is illegal)
    invalid_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": f"/service-jobs/{job_id}/assign",
        "pathParameters": {"id": job_id},
        "body": json.dumps({"technicianId": "tech-101"})
    }
    resp_conflict = lambda_handler(invalid_event, None)
    assert resp_conflict["statusCode"] == 409
    body_conflict = json.loads(resp_conflict["body"])
    assert body_conflict["success"] is False
    assert body_conflict["error"]["code"] == "INVALID_STATE_TRANSITION"
