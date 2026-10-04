"""
ServiceForge AI — Unit Tests: Bedrock Helper & Schema Validation
"""

import sys
import os
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from shared.bedrock import bedrock_client

def test_clean_and_parse_json_markdown_fences():
    raw_markdown = """```json
{
  "summary": "Compressor vibration detected",
  "detectedAssetCategory": "COMPRESSOR",
  "recommendedPriority": "HIGH",
  "confidenceScore": 0.95
}
```"""
    result = bedrock_client._clean_and_parse_json(raw_markdown)
    assert result["summary"] == "Compressor vibration detected"
    assert result["detectedAssetCategory"] == "COMPRESSOR"

def test_validate_and_normalize_schema_defaults():
    partial_data = {
        "summary": "HVAC system overheating",
        "detectedAssetCategory": "hvac",
        "symptoms": "Low refrigerant",
        "suggestedInspectionSteps": [
            "Check pressure levels"
        ]
    }
    normalized = bedrock_client._validate_and_normalize_schema(partial_data)
    assert normalized["detectedAssetCategory"] == "HVAC"
    assert isinstance(normalized["symptoms"], list)
    assert normalized["symptoms"] == ["Low refrigerant"]
    assert isinstance(normalized["suggestedInspectionSteps"], list)
    assert normalized["suggestedInspectionSteps"][0]["instruction"] == "Check pressure levels"
    assert normalized["suggestedInspectionSteps"][0]["stepNumber"] == 1
    assert normalized["humanReviewRequired"] is True

def test_analyze_service_request_fallback():
    req_data = {
        "requestId": "req-1234",
        "ticketNumber": "REQ-2026-0001",
        "description": "Industrial boiler temperature sensor trip alarm code 404.",
        "descriptionSource": "typed",
        "priority": "HIGH"
    }
    attachments = [
        {
            "fileName": "boiler_nameplate.jpg",
            "contentType": "image/jpeg",
            "bytes": b"fake_jpeg_binary_data"
        }
    ]
    result = bedrock_client.analyze_service_request(req_data, attachments)
    assert result["detectedAssetCategory"] == "BOILER"
    assert result["recommendedPriority"] == "HIGH"
    assert len(result["suggestedInspectionSteps"]) > 0
    assert any(step.get("critical") for step in result["suggestedInspectionSteps"])
    assert result["humanReviewRequired"] is True
