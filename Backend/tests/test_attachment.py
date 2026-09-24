"""
ServiceForge AI — Unit Tests: Attachment Lambda Handler
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from functions.attachment.handler import lambda_handler

MOCK_EVENT_CONTEXT = {
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "user-tech-001",
                "custom:org_id": "org-8841-alpha",
                "custom:role": "TECHNICIAN"
            }
        }
    }
}

def test_presign_attachment_success():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/attachments/presign",
        "body": json.dumps({
            "fileName": "compressor_panel.jpg",
            "contentType": "image/jpeg",
            "sizeBytes": 1024000
        })
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["success"] is True
    assert "uploadUrl" in body["data"]
    assert "attachments/orgs/org-8841-alpha/" in body["data"]["s3ObjectKey"]
    assert body["data"]["expiresInSeconds"] == 900

def test_presign_attachment_invalid_type_error():
    event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/attachments/presign",
        "body": json.dumps({
            "fileName": "script.sh",
            "contentType": "application/x-sh",
            "sizeBytes": 500
        })
    }
    resp = lambda_handler(event, None)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_INPUT"
