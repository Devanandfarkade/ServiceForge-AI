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

def test_s3_presigned_put_url_omits_content_type_from_params():
    from unittest.mock import MagicMock
    from shared.s3 import S3Client

    s3 = S3Client()
    s3.use_mock = False
    s3.client = MagicMock()
    s3.client.generate_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/test.jpg"

    url = s3.generate_presigned_put_url("test_key.jpg", "image/jpeg")

    s3.client.generate_presigned_url.assert_called_once_with(
        ClientMethod="put_object",
        Params={"Bucket": s3.bucket_name, "Key": "test_key.jpg"},
        ExpiresIn=900
    )
    assert url == "https://test-bucket.s3.amazonaws.com/test.jpg"

def test_s3_presigned_get_url_response_content_type():
    from unittest.mock import MagicMock
    from shared.s3 import S3Client

    s3 = S3Client()
    s3.use_mock = False
    s3.client = MagicMock()
    s3.client.generate_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/test.jpg?download=true"

    url = s3.generate_presigned_get_url("test_key.jpg", expires_in=900, content_type="image/jpeg")

    s3.client.generate_presigned_url.assert_called_once_with(
        ClientMethod="get_object",
        Params={"Bucket": s3.bucket_name, "Key": "test_key.jpg", "ResponseContentType": "image/jpeg"},
        ExpiresIn=900
    )
    assert "download=true" in url

def test_confirm_attachment_success():
    # First create presigned attachment item in in-memory store
    presign_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/attachments/presign",
        "body": json.dumps({
            "fileName": "test_photo.jpg",
            "contentType": "image/jpeg",
            "sizeBytes": 204800
        })
    }
    presign_resp = lambda_handler(presign_event, None)
    att_id = json.loads(presign_resp["body"])["data"]["attachmentId"]

    # Now call confirm endpoint
    confirm_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": f"/attachments/{att_id}/confirm",
        "pathParameters": {"id": att_id},
        "body": json.dumps({})
    }
    confirm_resp = lambda_handler(confirm_event, None)
    assert confirm_resp["statusCode"] == 200
    body = json.loads(confirm_resp["body"])
    assert body["success"] is True
    assert body["data"]["status"] == "ACTIVE"

def test_confirm_attachment_not_found():
    confirm_event = {
        **MOCK_EVENT_CONTEXT,
        "httpMethod": "POST",
        "path": "/attachments/att-nonexistent/confirm",
        "pathParameters": {"id": "att-nonexistent"},
        "body": json.dumps({})
    }
    confirm_resp = lambda_handler(confirm_event, None)
    assert confirm_resp["statusCode"] == 404
    body = json.loads(confirm_resp["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"

def test_confirm_attachment_with_decimal_size_bytes():
    import decimal
    from shared.models import clean_dynamodb_keys

    item = {
        "PK": "ORG#org-8841-alpha",
        "SK": "ATTACHMENT#pending#att-dec01",
        "attachmentId": "att-dec01",
        "sizeBytes": decimal.Decimal("397600"),
        "status": "ACTIVE"
    }

    cleaned = clean_dynamodb_keys(item)
    assert type(cleaned["sizeBytes"]) is int
    assert cleaned["sizeBytes"] == 397600
    
    # Test json.dumps serialization in responses.py
    from shared.responses import build_success_response
    resp = build_success_response(cleaned, 200, "req-test-dec")
    assert resp["statusCode"] == 200
    assert '"sizeBytes": 397600' in resp["body"]

