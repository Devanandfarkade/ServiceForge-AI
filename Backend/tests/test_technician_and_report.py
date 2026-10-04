"""
ServiceForge AI — Unit Tests: Technician & Report Lambda Handlers
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

try:
    from functions.technician.handler import lambda_handler as tech_handler
    from functions.report.handler import lambda_handler as report_handler
except ModuleNotFoundError:
    import importlib.util
    tech_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../functions/technician/handler.py'))
    spec_tech = importlib.util.spec_from_file_location("functions.technician.handler", tech_path)
    mod_tech = importlib.util.module_from_spec(spec_tech)
    spec_tech.loader.exec_module(mod_tech)
    tech_handler = mod_tech.lambda_handler

    report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../functions/report/handler.py'))
    spec_rep = importlib.util.spec_from_file_location("functions.report.handler", report_path)
    mod_rep = importlib.util.module_from_spec(spec_rep)
    spec_rep.loader.exec_module(mod_rep)
    report_handler = mod_rep.lambda_handler

from shared.dynamodb import db_client
from shared.models import build_service_job_item

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

def test_list_technicians_success():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "GET",
        "path": "/technicians"
    }
    resp = tech_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert isinstance(body["data"], list)

def test_report_generate_placeholder_boundary():
    # Store job item
    job_item = build_service_job_item(
        org_id="org-8841-alpha",
        request_id="req-55",
        title="Job for Report",
        job_id="job-999"
    )
    db_client.put_item(job_item)

    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/service-jobs/job-999/report/generate",
        "pathParameters": {"id": "job-999"}
    }
    resp = report_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert body["data"]["status"] == "ai_placeholder"
    assert "not connected in Phase 1" in body["data"]["message"]
