"""
ServiceForge AI — Service Report Lambda Handler
Handles Service Completion Report retrieval and AI report generation integration boundary.
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

def lambda_handler(event: dict, context) -> dict:
    request_id = extract_request_id(event)

    try:
        user_ctx = extract_user_context(event)
        org_id = user_ctx["organizationId"]
        user_id = user_ctx["userId"]
        role = user_ctx["role"]

        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("path") or event.get("rawPath", "/service-jobs/report")
        path_parameters = event.get("pathParameters") or {}
        job_id_param = path_parameters.get("id")

        logger.info(
            f"Report API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"Report.{http_method}"
        )

        if http_method == "OPTIONS":
            return build_success_response({"message": "CORS preflight successful"}, 200, request_id)

        # ----------------------------------------------------------------------
        # 1. GET /service-jobs/{id}/report — Retrieve Report Record & PDF Link
        # ----------------------------------------------------------------------
        if http_method == "GET":
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

            if not job_id_param:
                raise NotFoundError("Job ID parameter is required.")

            pk = f"ORG#{org_id}"
            sk = f"REPORT#{job_id_param}"
            report_item = db_client.get_item(pk, sk)

            if not report_item:
                raise NotFoundError(f"Service report for job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, report_item["organizationId"])
            return build_success_response(clean_dynamodb_keys(report_item), 200, request_id)

        # ----------------------------------------------------------------------
        # 2. POST /service-jobs/{id}/report/generate — AI Report Integration Boundary
        # ----------------------------------------------------------------------
        elif http_method == "POST" and path.endswith("/generate"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER"])

            if not job_id_param:
                raise NotFoundError("Job ID parameter is required.")

            pk = f"ORG#{org_id}"
            job_item = db_client.get_item(pk, f"JOB#{job_id_param}")

            if not job_item:
                raise NotFoundError(f"Service job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, job_item["organizationId"])

            # PHASE 1 BOUNDARY: Do NOT invoke Bedrock. Return placeholder response.
            return build_success_response({
                "status": "ai_placeholder",
                "message": "AI report generation (Amazon Bedrock) is not connected in Phase 1.",
                "jobId": job_id_param,
                "note": "Frontend PDF viewer will continue displaying client-generated report preview until Phase 2."
            }, 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
