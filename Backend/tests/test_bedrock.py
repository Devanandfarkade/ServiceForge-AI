"""
ServiceForge AI — Unit Tests: Bedrock Helper & Schema Validation
"""

import sys
import os
import json
import io
import pytest
from unittest.mock import MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from shared.bedrock import bedrock_client
from shared.errors import ServiceForgeError

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

def test_invoke_claude_controlled_json_retry():
    mock_client = MagicMock()
    
    # 1st call returns invalid non-JSON text; 2nd call returns valid JSON text
    first_resp = {
        "body": io.BytesIO(json.dumps({
            "content": [{"type": "text", "text": "Output text without valid JSON structure."}]
        }).encode("utf-8"))
    }
    
    second_resp = {
        "body": io.BytesIO(json.dumps({
            "content": [{"type": "text", "text": json.dumps({
                "summary": "Boiler thermal overload trip",
                "detectedAssetCategory": "BOILER",
                "recommendedPriority": "CRITICAL"
            })}]
        }).encode("utf-8"))
    }
    
    mock_client.invoke_model.side_effect = [first_resp, second_resp]

    original_client = bedrock_client.client
    bedrock_client.client = mock_client

    result, latency = bedrock_client._invoke_claude("apac.anthropic.claude-3-5-sonnet-20241022-v2:0", [{"type": "text", "text": "Test prompt"}])

    assert mock_client.invoke_model.call_count == 2
    assert result["detectedAssetCategory"] == "BOILER"
    assert result["recommendedPriority"] == "CRITICAL"
    bedrock_client.client = original_client

def test_bedrock_failure_raises_controlled_error_in_live_mode():
    mock_client = MagicMock()
    mock_client.invoke_model.side_effect = Exception("Bedrock ThrottlingException")

    original_client = bedrock_client.client
    original_use_mock = bedrock_client.use_mock

    bedrock_client.client = mock_client
    bedrock_client.use_mock = False  # Simulate live AWS environment

    with pytest.raises(ServiceForgeError) as exc_info:
        bedrock_client.analyze_service_request({"requestId": "req-fail-test", "description": "Test issue"})

    assert exc_info.value.status_code == 502
    assert exc_info.value.code == "BEDROCK_SERVICE_ERROR"
    assert "Bedrock ThrottlingException" in str(exc_info.value)

    bedrock_client.client = original_client
    bedrock_client.use_mock = original_use_mock

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
