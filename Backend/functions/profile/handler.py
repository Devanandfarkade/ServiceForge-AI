"""
ServiceForge AI — User Profile Lambda Handler
Handles retrieving and updating authenticated user profile details in single-table DynamoDB.
"""

import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.dynamodb import db_client
from shared.errors import ValidationError, ServiceForgeError
from shared.logging_utils import logger
from shared.models import clean_dynamodb_keys, now_iso
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception

ALLOWED_UPDATE_FIELDS = {
    "firstName", "lastName", "fullName", "phone", "avatarUrl", "jobTitle", "department"
}

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
        email = user_ctx.get("email", "")

        path = event.get("path") or event.get("rawPath", "/user/profile")

        logger.info(
            f"Profile API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"Profile.{http_method}"
        )

        require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

        pk = f"ORG#{org_id}"
        sk = f"USER_PROFILE#{user_id}"

        # ----------------------------------------------------------------------
        # 1. GET /user/profile — Retrieve Authenticated User Profile
        # ----------------------------------------------------------------------
        if http_method == "GET":
            item = db_client.get_item(pk, sk)

            if not item:
                # Construct default profile from Cognito claims
                item = {
                    "PK": pk,
                    "SK": sk,
                    "organizationId": org_id,
                    "userId": user_id,
                    "email": email or f"{user_id}@serviceforge.ai",
                    "firstName": "Marcus" if "manager" in user_id else "Service",
                    "lastName": "Smith" if "manager" in user_id else "User",
                    "fullName": "Marcus Smith" if "manager" in user_id else "Service User",
                    "role": role,
                    "phone": "+1 (555) 019-2834",
                    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                    "department": "Operations",
                    "createdAt": now_iso(),
                    "updatedAt": now_iso()
                }
                db_client.put_item(item)

            cleaned = clean_dynamodb_keys(item)
            cleaned["email"] = email or cleaned.get("email", "")
            cleaned["role"] = role
            return build_success_response(cleaned, 200, request_id)

        # ----------------------------------------------------------------------
        # 2. PATCH /user/profile — Update Profile Information
        # ----------------------------------------------------------------------
        elif http_method in ["PATCH", "PUT"]:
            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            if not isinstance(payload, dict):
                raise ValidationError("Request body must be a valid JSON object.")

            # Validate unsupported fields
            unsupported = [k for k in payload.keys() if k not in ALLOWED_UPDATE_FIELDS]
            if unsupported:
                raise ValidationError(f"Invalid field(s) provided: {', '.join(unsupported)}. Allowed fields: {', '.join(sorted(ALLOWED_UPDATE_FIELDS))}")

            existing = db_client.get_item(pk, sk)
            if not existing:
                existing = {
                    "PK": pk,
                    "SK": sk,
                    "organizationId": org_id,
                    "userId": user_id,
                    "email": email or f"{user_id}@serviceforge.ai",
                    "role": role,
                    "createdAt": now_iso()
                }

            updates = {"updatedAt": now_iso()}
            for k, v in payload.items():
                updates[k] = v

            # Keep fullName synced if firstName/lastName updated
            first = payload.get("firstName", existing.get("firstName", "Marcus"))
            last = payload.get("lastName", existing.get("lastName", "Smith"))
            if "firstName" in payload or "lastName" in payload:
                updates["fullName"] = f"{first} {last}".strip()

            updated_item = db_client.update_item(pk, sk, updates)
            cleaned = clean_dynamodb_keys(updated_item)
            cleaned["email"] = email or cleaned.get("email", "")
            cleaned["role"] = role
            return build_success_response(cleaned, 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
