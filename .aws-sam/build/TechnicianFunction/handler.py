"""
ServiceForge AI — Technician Lambda Handler
Handles technician directory, skill matrix profile retrieval, and status querying.
"""

import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.dynamodb import db_client
from shared.errors import NotFoundError
from shared.logging_utils import logger
from shared.models import clean_dynamodb_keys
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception

# Mock technician seed records for demonstration when datastore is initialized
MOCK_TECHNICIANS = [
    {
        "technicianId": "tech-101",
        "fullName": "David Miller",
        "email": "d.miller@serviceforge.ai",
        "role": "TECHNICIAN",
        "skillProfile": "HVAC & Compressors Specialist",
        "certifications": ["LOTO Certified", "EPA Universal", "Compressor Level 3"],
        "status": "AVAILABLE",
        "location": "North Sector"
    },
    {
        "technicianId": "tech-102",
        "fullName": "Sarah Jenkins",
        "email": "s.jenkins@serviceforge.ai",
        "role": "TECHNICIAN",
        "skillProfile": "Electrical & Controls Engineer",
        "certifications": ["NFPA 70E", "PLC Specialist", "High Voltage Safety"],
        "status": "ON_JOB",
        "location": "Central Facility"
    }
]

def lambda_handler(event: dict, context) -> dict:
    request_id = extract_request_id(event)

    try:
        user_ctx = extract_user_context(event)
        org_id = user_ctx["organizationId"]
        user_id = user_ctx["userId"]
        role = user_ctx["role"]

        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("path") or event.get("rawPath", "/technicians")
        path_parameters = event.get("pathParameters") or {}
        tech_id_param = path_parameters.get("id")

        logger.info(
            f"Technician API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"Technician.{http_method}"
        )

        if http_method == "OPTIONS":
            return build_success_response({"message": "CORS preflight successful"}, 200, request_id)

        # ----------------------------------------------------------------------
        # 1. GET /technicians — List Technicians for Tenant
        # ----------------------------------------------------------------------
        if http_method == "GET" and not tech_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN"])

            items = db_client.query(
                gsi_name="GSI1",
                gsi_pk=f"ORG#{org_id}#ROLE#TECHNICIAN"
            )

            if not items:
                # Provide tenant-scoped initial technician list
                items = [{**tech, "organizationId": org_id} for tech in MOCK_TECHNICIANS]

            cleaned_items = [clean_dynamodb_keys(item) for item in items]
            return build_success_response(cleaned_items, 200, request_id)

        # ----------------------------------------------------------------------
        # 2. GET /technicians/{id} — Retrieve Specific Technician Profile
        # ----------------------------------------------------------------------
        elif http_method == "GET" and tech_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN"])

            item = db_client.get_item(f"ORG#{org_id}", f"USER#{tech_id_param}")

            if not item:
                # Check mock list fallback
                for tech in MOCK_TECHNICIANS:
                    if tech["technicianId"] == tech_id_param:
                        item = {**tech, "organizationId": org_id}
                        break

            if not item:
                raise NotFoundError(f"Technician '{tech_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])
            return build_success_response(clean_dynamodb_keys(item), 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
