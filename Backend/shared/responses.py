"""
ServiceForge AI — Standardized Response Helper
Formats API Gateway proxy responses according to API_SPEC.md.
"""

import json
from datetime import datetime, timezone
import uuid
from shared.logging_utils import logger
from shared.errors import ServiceForgeError

COMMON_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
}

def extract_request_id(event: dict) -> str:
    if not isinstance(event, dict):
        return str(uuid.uuid4())
    request_context = event.get("requestContext", {})
    if isinstance(request_context, dict):
        return request_context.get("requestId") or str(uuid.uuid4())
    return str(uuid.uuid4())

def build_success_response(data: dict | list | str, status_code: int = 200, request_id: str = None) -> dict:
    req_id = request_id or str(uuid.uuid4())
    body = {
        "success": True,
        "status_code": status_code,
        "data": data,
        "error": None,
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": req_id
        }
    }
    return {
        "statusCode": status_code,
        "headers": COMMON_HEADERS,
        "body": json.dumps(body)
    }

def build_error_response(status_code: int, message: str, code: str = "INTERNAL_ERROR", details: list = None, request_id: str = None, error_details: Exception = None) -> dict:
    req_id = request_id or str(uuid.uuid4())
    if error_details:
        logger.error(f"[ERROR] {status_code} {code} - {message}", request_id=req_id, extra_data={"details": str(error_details)})
    else:
        logger.warning(f"[WARNING] {status_code} {code} - {message}", request_id=req_id)

    body = {
        "success": False,
        "status_code": status_code,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details or []
        },
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": req_id
        }
    }
    return {
        "statusCode": status_code,
        "headers": COMMON_HEADERS,
        "body": json.dumps(body)
    }

def handle_exception(exc: Exception, request_id: str = None) -> dict:
    if isinstance(exc, ServiceForgeError):
        return build_error_response(
            status_code=exc.status_code,
            message=exc.message,
            code=exc.code,
            details=exc.details,
            request_id=request_id
        )
    return build_error_response(
        status_code=500,
        message="An unexpected internal server error occurred.",
        code="INTERNAL_ERROR",
        request_id=request_id,
        error_details=exc
    )

# Alias build_response for backward compatibility
build_response = build_success_response
