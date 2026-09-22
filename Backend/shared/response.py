"""
ServiceForge AI — Shared Response Helper
Provides standardized API Gateway proxy response formatting with CORS headers and safe error handling.
"""

import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

COMMON_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
}

def build_response(status_code: int, data: dict | list | str) -> dict:
    """
    Builds a standard API Gateway proxy response.
    
    :param status_code: HTTP status code (e.g. 200, 201, 400, 404, 500)
    :param data: Python dict, list, or string to be returned as JSON body
    :return: API Gateway compatible response dictionary
    """
    body_content = json.dumps(data) if isinstance(data, (dict, list)) else json.dumps({"message": str(data)})
    
    return {
        "statusCode": status_code,
        "headers": COMMON_HEADERS,
        "body": body_content
    }

def build_error_response(status_code: int, public_message: str, error_details: Exception | str = None) -> dict:
    """
    Builds a secure API Gateway error response that logs internal exception details
    to CloudWatch while returning a sanitized message to the caller.
    
    :param status_code: HTTP error status code (e.g. 400, 403, 404, 500)
    :param public_message: Safe error message returned to client
    :param error_details: Internal exception or detailed string logged to CloudWatch only
    """
    if error_details:
        logger.error(f"[ERROR] {status_code} - {public_message} | Internal Details: {error_details}")
    else:
        logger.warning(f"[WARNING] {status_code} - {public_message}")
        
    return build_response(
        status_code=status_code,
        data={
            "error": True,
            "status_code": status_code,
            "message": public_message
        }
    )
