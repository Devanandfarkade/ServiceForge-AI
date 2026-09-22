"""
ServiceForge AI — Service Request Lambda Handler
Handles Service Request creation, retrieval, and Amazon Bedrock decision support trigger points.
"""

import json
import logging
import sys
import os

# Include shared package path for standalone Lambda runtime compatibility
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.response import build_response, build_error_response
from shared.config import Config

logger = logging.getLogger()
logger.setLevel(Config.LOG_LEVEL)

def lambda_handler(event: dict, context) -> dict:
    """
    AWS Lambda entry point for Service Request API endpoints.
    
    Supported HTTP Methods (Future):
    - POST /api/requests: Create request & trigger Bedrock AI extraction
    - GET /api/requests: List active service requests
    - GET /api/requests/{id}: Retrieve specific request & AI analysis
    """
    try:
        http_method = event.get("httpMethod", "GET")
        path = event.get("path", "/api/requests")
        
        logger.info(f"Received request: {http_method} {path}")
        
        # Handle CORS preflight OPTIONS request
        if http_method == "OPTIONS":
            return build_response(200, {"message": "CORS preflight successful"})
            
        if http_method == "GET":
            # TODO: Query DynamoDB single-table for Service Requests (PK: REQ#...)
            return build_response(200, {
                "status": "success",
                "message": "Service Request API handler initialized.",
                "region": Config.AWS_REGION,
                "data": {
                    "requests": [],
                    "note": "TODO: Implement DynamoDB query and Amazon Bedrock integration."
                }
            })
            
        elif http_method == "POST":
            # TODO: Parse raw customer issue text from event body
            # TODO: Invoke Amazon Bedrock (Claude 3.5 Sonnet) for structured entity extraction
            # TODO: Save raw request & AI analysis to DynamoDB
            return build_response(201, {
                "status": "success",
                "message": "Service Request intake endpoint ready.",
                "note": "TODO: Connect Bedrock model for AI decision support extraction."
            })
            
        else:
            return build_error_response(405, f"Method {http_method} not allowed.")
            
    except Exception as e:
        return build_error_response(
            status_code=500,
            public_message="An internal server error occurred while processing the service request.",
            error_details=e
        )
