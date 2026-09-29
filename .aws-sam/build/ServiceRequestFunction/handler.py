"""
ServiceForge AI — Service Request Lambda Handler
Handles Service Request creation, retrieval, status updates, and AI integration boundary.
"""

import json
import os
import sys

# Add shared package to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.config import Config
from shared.dynamodb import db_client
from shared.errors import NotFoundError, ServiceForgeError
from shared.logging_utils import logger
from shared.models import build_service_request_item, clean_dynamodb_keys
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception
from shared.validation import validate_service_request_input

def lambda_handler(event: dict, context) -> dict:
    request_id = extract_request_id(event)
    
    try:
        user_ctx = extract_user_context(event)
        org_id = user_ctx["organizationId"]
        user_id = user_ctx["userId"]
        role = user_ctx["role"]
        
        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("path") or event.get("rawPath", "/service-requests")
        path_parameters = event.get("pathParameters") or {}
        req_id_param = path_parameters.get("id")

        logger.info(
            f"ServiceRequest API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"ServiceRequest.{http_method}"
        )

        if http_method == "OPTIONS":
            return build_success_response({"message": "CORS preflight successful"}, 200, request_id)

        # ----------------------------------------------------------------------
        # 1. POST /service-requests — Create Service Request
        # ----------------------------------------------------------------------
        if http_method == "POST" and not path.endswith("/analyze"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "CUSTOMER"])
            
            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            validated = validate_service_request_input(payload)

            request_item = build_service_request_item(
                org_id=org_id,
                user_id=user_id,
                description=validated["description"],
                description_source=validated["descriptionSource"],
                priority=validated["priority"],
                customer_id=validated.get("customerId"),
                asset_id=validated.get("assetId"),
                attachments=validated.get("attachments")
            )

            db_client.put_item(request_item)
            cleaned_resp = clean_dynamodb_keys(request_item)

            logger.info(
                f"Created Service Request {request_item['ticketNumber']} for org '{org_id}'",
                request_id=request_id,
                org_id=org_id,
                user_id=user_id
            )

            return build_success_response(cleaned_resp, 201, request_id)

        # ----------------------------------------------------------------------
        # 2. GET /service-requests — List Service Requests for Tenant
        # ----------------------------------------------------------------------
        elif http_method == "GET" and not req_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "CUSTOMER"])
            
            query_params = event.get("queryStringParameters") or {}
            status_filter = query_params.get("status")

            if status_filter:
                items = db_client.query(
                    gsi_name="GSI1",
                    gsi_pk=f"ORG#{org_id}#STATUS#{status_filter.upper()}"
                )
            else:
                items = db_client.query(
                    pk=f"ORG#{org_id}",
                    sk_prefix="REQ#"
                )

            cleaned_items = [clean_dynamodb_keys(item) for item in items]
            return build_success_response(cleaned_items, 200, request_id)

        # ----------------------------------------------------------------------
        # 3. GET /service-requests/{id} — Retrieve Specific Request
        # ----------------------------------------------------------------------
        elif http_method == "GET" and req_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "CUSTOMER"])

            pk = f"ORG#{org_id}"
            sk = f"REQ#{req_id_param}"
            item = db_client.get_item(pk, sk)

            if not item:
                raise NotFoundError(f"Service request '{req_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])
            return build_success_response(clean_dynamodb_keys(item), 200, request_id)

        # ----------------------------------------------------------------------
        # 4. POST /service-requests/{id}/analyze — AI Integration Placeholder
        # ----------------------------------------------------------------------
        elif http_method == "POST" and path.endswith("/analyze"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER"])

            target_id = req_id_param or path.split("/")[-2]
            pk = f"ORG#{org_id}"
            sk = f"REQ#{target_id}"
            item = db_client.get_item(pk, sk)

            if not item:
                raise NotFoundError(f"Service request '{target_id}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])

            # PHASE 1 BOUNDARY: Do NOT invoke Bedrock. Return integration placeholder.
            return build_success_response({
                "status": "ai_placeholder",
                "message": "AI analysis (Amazon Bedrock) is not connected in Phase 1.",
                "requestId": target_id,
                "note": "Frontend may continue using client-side mock AI output until Phase 2 integration."
            }, 200, request_id)

        # ----------------------------------------------------------------------
        # 5. PATCH /service-requests/{id} — Status Update / Approval
        # ----------------------------------------------------------------------
        elif http_method in ["PATCH", "PUT"] and req_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER"])

            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            pk = f"ORG#{org_id}"
            sk = f"REQ#{req_id_param}"
            existing = db_client.get_item(pk, sk)

            if not existing:
                raise NotFoundError(f"Service request '{req_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, existing["organizationId"])

            new_status = payload.get("status", existing.get("status"))
            new_priority = payload.get("priority", existing.get("priority"))

            updates = {
                "status": new_status,
                "priority": new_priority,
                "GSI1PK": f"ORG#{org_id}#STATUS#{new_status}",
                "GSI2PK": f"ORG#{org_id}#PRIORITY#{new_priority}"
            }

            updated_item = db_client.update_item(pk, sk, updates)
            return build_success_response(clean_dynamodb_keys(updated_item), 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
