"""
ServiceForge AI — Attachment Lambda Handler
Handles S3 presigned upload URL generation, upload confirmation, and attachment deletion.
"""

import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.config import Config
from shared.dynamodb import db_client
from shared.errors import NotFoundError, ServiceForgeError
from shared.logging_utils import logger
from shared.models import build_attachment_item, clean_dynamodb_keys
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception
from shared.s3 import s3_client
from shared.validation import validate_attachment_presign_input

def lambda_handler(event: dict, context) -> dict:
    request_id = extract_request_id(event)

    try:
        user_ctx = extract_user_context(event)
        org_id = user_ctx["organizationId"]
        user_id = user_ctx["userId"]
        role = user_ctx["role"]

        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("path") or event.get("rawPath", "/attachments/presign")
        path_parameters = event.get("pathParameters") or {}
        att_id_param = path_parameters.get("id")

        logger.info(
            f"Attachment API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"Attachment.{http_method}"
        )

        if http_method == "OPTIONS":
            return build_success_response({"message": "CORS preflight successful"}, 200, request_id)

        # ----------------------------------------------------------------------
        # 1. POST /attachments/presign — Generate S3 Presigned Upload URL
        # ----------------------------------------------------------------------
        if http_method == "POST" and path.endswith("/presign"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            service_req_id = payload.get("serviceRequestId") or payload.get("requestId")

            # Check existing request ownership if provided
            current_att_count = 0
            if service_req_id:
                req_item = db_client.get_item(f"ORG#{org_id}", f"REQ#{service_req_id}")
                if not req_item:
                    raise NotFoundError(f"Target service request '{service_req_id}' not found in user organization.")
                verify_tenant_access(user_ctx, req_item["organizationId"])
                current_att_count = len(req_item.get("attachments", []))

            validated = validate_attachment_presign_input(payload, current_attachment_count=current_att_count)

            # Generate attachment ID and tenant-isolated S3 object key
            att_id = f"att-{str(os.urandom(4).hex())}"
            s3_key = s3_client.build_tenant_object_key(
                org_id=org_id,
                request_id=service_req_id,
                attachment_id=att_id,
                filename=validated["fileName"]
            )

            # Generate presigned PUT URL
            upload_url = s3_client.generate_presigned_put_url(
                object_key=s3_key,
                content_type=validated["contentType"],
                expires_in=Config.PRESIGNED_URL_EXPIRATION_SECONDS
            )

            # Store metadata record in DynamoDB with PRESIGNED status
            att_item = build_attachment_item(
                org_id=org_id,
                entity_id=service_req_id or "pending",
                file_name=validated["fileName"],
                content_type=validated["contentType"],
                size_bytes=validated["sizeBytes"],
                s3_object_key=s3_key,
                s3_bucket=Config.S3_BUCKET_NAME,
                entity_type=validated["entityType"],
                uploaded_by=user_id,
                attachment_id=att_id
            )
            db_client.put_item(att_item)

            resp_data = {
                "attachmentId": att_id,
                "uploadUrl": upload_url,
                "s3ObjectKey": s3_key,
                "expiresInSeconds": Config.PRESIGNED_URL_EXPIRATION_SECONDS,
                "fileName": validated["fileName"],
                "contentType": validated["contentType"],
                "sizeBytes": validated["sizeBytes"],
                "status": "PRESIGNED"
            }

            logger.info(
                f"Generated Presigned Upload URL for attachment '{att_id}' key '{s3_key}'",
                request_id=request_id,
                org_id=org_id
            )

            return build_success_response(resp_data, 200, request_id)

        # ----------------------------------------------------------------------
        # 2. POST /attachments/{id}/confirm — Confirm Upload Completion
        # ----------------------------------------------------------------------
        elif http_method == "POST" and att_id_param and path.endswith("/confirm"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

            # Query GSI1 for metadata or match attachment
            items = db_client.query(pk=f"ORG#{org_id}", sk_prefix="ATTACHMENT#")
            target_att = None
            for item in items:
                if item.get("attachmentId") == att_id_param:
                    target_att = item
                    break

            if not target_att:
                raise NotFoundError(f"Attachment '{att_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, target_att["organizationId"])

            updated_att = db_client.update_item(
                pk=target_att["PK"],
                sk=target_att["SK"],
                updates={"status": "ACTIVE"}
            )

            return build_success_response(clean_dynamodb_keys(updated_att), 200, request_id)

        # ----------------------------------------------------------------------
        # 3. DELETE /attachments/{id} — Delete Attachment Metadata
        # ----------------------------------------------------------------------
        elif http_method == "DELETE" and att_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "CUSTOMER"])

            items = db_client.query(pk=f"ORG#{org_id}", sk_prefix="ATTACHMENT#")
            target_att = None
            for item in items:
                if item.get("attachmentId") == att_id_param:
                    target_att = item
                    break

            if not target_att:
                raise NotFoundError(f"Attachment '{att_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, target_att["organizationId"])

            db_client.delete_item(target_att["PK"], target_att["SK"])
            return build_success_response({"success": True, "message": "Attachment deleted successfully."}, 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
