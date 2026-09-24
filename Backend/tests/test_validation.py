"""
ServiceForge AI — Unit Tests: Input Validation & Sanitization Governance
"""

import sys
import os
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from shared.validation import (
    sanitize_filename,
    validate_service_request_input,
    validate_attachment_presign_input,
    validate_job_status_transition
)
from shared.errors import ValidationError, ConflictError

def test_sanitize_filename_traversal():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("normal_photo.jpg") == "normal_photo.jpg"

def test_validate_service_request_input_valid():
    payload = {
        "description": "Industrial air compressor leaking oil.",
        "descriptionSource": "voice",
        "priority": "HIGH",
        "attachments": ["att-001", "att-002"]
    }
    validated = validate_service_request_input(payload)
    assert validated["description"] == "Industrial air compressor leaking oil."
    assert validated["descriptionSource"] == "voice"
    assert validated["priority"] == "HIGH"
    assert len(validated["attachments"]) == 2

def test_validate_service_request_empty_description():
    with pytest.raises(ValidationError):
        validate_service_request_input({"description": "   "})

def test_validate_service_request_invalid_source():
    with pytest.raises(ValidationError):
        validate_service_request_input({"description": "Test issue", "descriptionSource": "unsupported_source"})

def test_validate_attachment_presign_valid():
    payload = {
        "fileName": "site_photo.png",
        "contentType": "image/png",
        "sizeBytes": 2048000
    }
    validated = validate_attachment_presign_input(payload, current_attachment_count=0)
    assert validated["fileName"] == "site_photo.png"
    assert validated["contentType"] == "image/png"

def test_validate_attachment_presign_invalid_mime():
    payload = {
        "fileName": "malicious.exe",
        "contentType": "application/x-msdownload",
        "sizeBytes": 500
    }
    with pytest.raises(ValidationError):
        validate_attachment_presign_input(payload)

def test_validate_attachment_presign_oversized():
    payload = {
        "fileName": "huge_file.pdf",
        "contentType": "application/pdf",
        "sizeBytes": 20 * 1024 * 1024  # 20 MB (Exceeds 15 MB limit)
    }
    with pytest.raises(ValidationError):
        validate_attachment_presign_input(payload)

def test_validate_attachment_max_count_exceeded():
    payload = {
        "fileName": "photo.jpg",
        "contentType": "image/jpeg",
        "sizeBytes": 1000
    }
    with pytest.raises(ValidationError):
        validate_attachment_presign_input(payload, current_attachment_count=10)

def test_job_status_transition_valid():
    # Should not raise exception
    validate_job_status_transition("UNASSIGNED", "ASSIGNED")
    validate_job_status_transition("ASSIGNED", "IN_PROGRESS")
    validate_job_status_transition("IN_PROGRESS", "COMPLETED")

def test_job_status_transition_invalid_conflict():
    # Attempting invalid jump from UNASSIGNED directly to IN_PROGRESS or COMPLETED back to ASSIGNED
    with pytest.raises(ConflictError):
        validate_job_status_transition("COMPLETED", "ASSIGNED")
