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
from shared.bedrock import bedrock_client
from shared.config import Config
from shared.dynamodb import db_client
from shared.errors import NotFoundError, ServiceForgeError
from shared.logging_utils import logger
from shared.models import build_ai_analysis_item, build_service_request_item, clean_dynamodb_keys
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception
from shared.s3 import s3_client
from shared.validation import validate_service_request_input

def lambda_handler(event: dict, context) -> dict:
    request_id = extract_request_id(event)
    
    try:
        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        if http_method == "OPTIONS":
            return build_success_response({"message": "CORS preflight successful"}, 200, request_id)

        user_ctx = extract_user_context(event)
        org_id = user_ctx["organizationId"]
        user_id = user_ctx["userId"]
        role = user_ctx["role"]
        
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

            ai_item = db_client.get_item(pk, f"AI_ANALYSIS#{req_id_param}")
            cleaned_req = clean_dynamodb_keys(item)
            if ai_item:
                cleaned_req["aiAnalysis"] = clean_dynamodb_keys(ai_item)
                cleaned_req["hasAiAnalysis"] = True

            return build_success_response(cleaned_req, 200, request_id)

        # ----------------------------------------------------------------------
        # 4. POST /service-requests/{id}/analyze — Real Amazon Bedrock AI Triage
        # ----------------------------------------------------------------------
        elif http_method == "POST" and path.endswith("/analyze"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "CUSTOMER"])

            target_id = req_id_param or path.split("/")[-2]
            pk = f"ORG#{org_id}"
            sk = f"REQ#{target_id}"
            item = db_client.get_item(pk, sk)

            if not item:
                raise NotFoundError(f"Service request '{target_id}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])

            # 1. Fetch attachment metadata & binary bytes if attachments exist
            attachment_items = []
            att_ids = item.get("attachments", [])
            if att_ids:
                all_atts = db_client.query(pk=pk, sk_prefix="ATTACHMENT#")
                for att in all_atts:
                    a_id = att.get("attachmentId")
                    e_id = att.get("entityId")
                    if (a_id in att_ids or e_id == target_id) and att.get("s3ObjectKey"):
                        att_dict = dict(att)
                        try:
                            att_dict["bytes"] = s3_client.get_object_bytes(att["s3ObjectKey"])
                        except Exception as err:
                            logger.warning(f"Could not retrieve bytes for attachment '{a_id}' key '{att.get('s3ObjectKey')}': {err}")
                            att_dict["bytes"] = None
                        attachment_items.append(att_dict)

            # 2. Fetch customer and asset metadata if available
            customer_data = None
            if item.get("customerId"):
                customer_data = db_client.get_item(pk, f"CUSTOMER#{item['customerId']}")

            asset_data = None
            if item.get("assetId"):
                asset_data = db_client.get_item(pk, f"ASSET#{item['assetId']}")

            # 3. Invoke Bedrock multimodal analysis
            ai_result = bedrock_client.analyze_service_request(
                request_data=item,
                attachments=attachment_items,
                customer_data=customer_data,
                asset_data=asset_data
            )

            # 4. Store AIAnalysis audit record in DynamoDB (SK = AI_ANALYSIS#{requestId})
            ai_analysis_item = build_ai_analysis_item(
                org_id=org_id,
                request_id=target_id,
                ai_result=ai_result,
                model_id=ai_result.get("bedrockModelId")
            )
            db_client.put_item(ai_analysis_item)

            # 5. Update ServiceRequest status to PENDING_REVIEW in DynamoDB
            rec_prio = ai_result.get("recommendedPriority", item.get("priority", "HIGH"))
            db_client.update_item(pk, sk, {
                "status": "PENDING_REVIEW",
                "priority": rec_prio,
                "GSI1PK": f"ORG#{org_id}#STATUS#PENDING_REVIEW",
                "GSI2PK": f"ORG#{org_id}#PRIORITY#{rec_prio}"
            })

            cleaned_result = clean_dynamodb_keys(ai_result)
            return build_success_response(cleaned_result, 200, request_id)


        # ----------------------------------------------------------------------
        # 5. PATCH /service-requests/{id} — Status Update / Approval
        # ----------------------------------------------------------------------
        elif http_method in ["PATCH", "PUT"] and req_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

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

            if "attachments" in payload:
                updates["attachments"] = payload["attachments"]

            updated_item = db_client.update_item(pk, sk, updates)
            return build_success_response(clean_dynamodb_keys(updated_item), 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
