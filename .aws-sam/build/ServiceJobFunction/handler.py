"""
ServiceForge AI — Service Job Lambda Handler
Handles Service Job creation, status state machine transitions, assignment, and updates.
"""

import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.dynamodb import db_client
from shared.errors import NotFoundError, ServiceForgeError
from shared.logging_utils import logger
from shared.models import (
    build_job_assignment_item,
    build_job_update_item,
    build_service_job_item,
    clean_dynamodb_keys
)
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception
from shared.validation import validate_job_status_transition

def lambda_handler(event: dict, context) -> dict:
    request_id = extract_request_id(event)

    try:
        user_ctx = extract_user_context(event)
        org_id = user_ctx["organizationId"]
        user_id = user_ctx["userId"]
        role = user_ctx["role"]

        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("path") or event.get("rawPath", "/service-jobs")
        path_parameters = event.get("pathParameters") or {}
        job_id_param = path_parameters.get("id")

        logger.info(
            f"ServiceJob API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"ServiceJob.{http_method}"
        )

        if http_method == "OPTIONS":
            return build_success_response({"message": "CORS preflight successful"}, 200, request_id)

        # ----------------------------------------------------------------------
        # 1. POST /service-jobs — Create Service Job from Approved Request
        # ----------------------------------------------------------------------
        if http_method == "POST" and not job_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER"])

            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            req_id = payload.get("requestId")
            title = payload.get("title") or payload.get("name", "Field Service Job Inspection")
            priority = payload.get("priority", "HIGH")
            target_sla = payload.get("targetSlaDeadline")

            job_item = build_service_job_item(
                org_id=org_id,
                request_id=req_id,
                title=title,
                priority=priority,
                customer_id=payload.get("customerId"),
                asset_id=payload.get("assetId"),
                target_sla_deadline=target_sla
            )

            db_client.put_item(job_item)
            return build_success_response(clean_dynamodb_keys(job_item), 201, request_id)

        # ----------------------------------------------------------------------
        # 2. GET /service-jobs — List Service Jobs for Tenant
        # ----------------------------------------------------------------------
        elif http_method == "GET" and not job_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN"])

            query_params = event.get("queryStringParameters") or {}
            status_filter = query_params.get("status")
            tech_filter = query_params.get("assignedTechnicianId") or query_params.get("technicianId")

            if status_filter:
                items = db_client.query(
                    gsi_name="GSI1",
                    gsi_pk=f"ORG#{org_id}#JOB_STATUS#{status_filter.upper()}"
                )
            elif tech_filter:
                items = db_client.query(
                    gsi_name="GSI2",
                    gsi_pk=f"ORG#{org_id}#TECH#{tech_filter}"
                )
            else:
                items = db_client.query(
                    pk=f"ORG#{org_id}",
                    sk_prefix="JOB#"
                )

            cleaned_items = [clean_dynamodb_keys(item) for item in items]
            return build_success_response(cleaned_items, 200, request_id)

        # ----------------------------------------------------------------------
        # 3. GET /service-jobs/{id} — Retrieve Specific Service Job
        # ----------------------------------------------------------------------
        elif http_method == "GET" and job_id_param and not path.endswith("/updates") and not path.endswith("/report"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

            pk = f"ORG#{org_id}"
            sk = f"JOB#{job_id_param}"
            item = db_client.get_item(pk, sk)

            if not item:
                raise NotFoundError(f"Service job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])
            return build_success_response(clean_dynamodb_keys(item), 200, request_id)

        # ----------------------------------------------------------------------
        # 4. POST /service-jobs/{id}/assign — Assign Technician to Job
        # ----------------------------------------------------------------------
        elif http_method == "POST" and job_id_param and path.endswith("/assign"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER"])

            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            tech_id = payload.get("technicianId")
            if not tech_id:
                raise NotFoundError("Required field 'technicianId' cannot be empty.")

            pk = f"ORG#{org_id}"
            sk = f"JOB#{job_id_param}"
            job_item = db_client.get_item(pk, sk)

            if not job_item:
                raise NotFoundError(f"Service job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, job_item["organizationId"])

            # State transition check
            validate_job_status_transition(job_item["status"], "ASSIGNED")

            # Update job status and assigned technician ID
            db_client.update_item(pk, sk, {
                "status": "ASSIGNED",
                "assignedTechnicianId": tech_id,
                "GSI1PK": f"ORG#{org_id}#JOB_STATUS#ASSIGNED",
                "GSI2PK": f"ORG#{org_id}#TECH#{tech_id}"
            })

            # Create assignment record
            assignment_item = build_job_assignment_item(
                org_id=org_id,
                job_id=job_id_param,
                technician_id=tech_id,
                assigned_by_user_id=user_id,
                scheduled_start_time=payload.get("scheduledStartTime")
            )
            db_client.put_item(assignment_item)

            return build_success_response(clean_dynamodb_keys(assignment_item), 200, request_id)

        # ----------------------------------------------------------------------
        # 5. POST /service-jobs/{id}/updates — Log Field Progress Update
        # ----------------------------------------------------------------------
        elif http_method == "POST" and job_id_param and path.endswith("/updates"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "TECHNICIAN"])

            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            pk = f"ORG#{org_id}"
            sk = f"JOB#{job_id_param}"
            job_item = db_client.get_item(pk, sk)

            if not job_item:
                raise NotFoundError(f"Service job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, job_item["organizationId"])

            update_item = build_job_update_item(
                org_id=org_id,
                job_id=job_id_param,
                technician_id=user_id,
                update_type=payload.get("updateType", "NOTE"),
                notes=payload.get("notes", ""),
                step_number_completed=payload.get("stepNumberCompleted"),
                parts_used=payload.get("partsUsed")
            )

            db_client.put_item(update_item)
            return build_success_response(clean_dynamodb_keys(update_item), 201, request_id)

        # ----------------------------------------------------------------------
        # 6. GET /service-jobs/{id}/updates — List Field Progress Updates Timeline
        # ----------------------------------------------------------------------
        elif http_method == "GET" and job_id_param and path.endswith("/updates"):
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

            pk = f"ORG#{org_id}"
            sk = f"JOB#{job_id_param}"
            job_item = db_client.get_item(pk, sk)

            if not job_item:
                raise NotFoundError(f"Service job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, job_item["organizationId"])

            updates = db_client.query(pk=f"ORG#{org_id}", sk_prefix=f"UPDATE#{job_id_param}#")
            cleaned_updates = [clean_dynamodb_keys(u) for u in updates]
            return build_success_response(cleaned_updates, 200, request_id)

        # ----------------------------------------------------------------------
        # 7. POST /service-jobs/{id}/complete or PATCH /service-jobs/{id}
        # ----------------------------------------------------------------------
        elif (http_method in ["PATCH", "PUT", "POST"]) and job_id_param:
            require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN"])

            body_str = event.get("body", "{}") or "{}"
            payload = json.loads(body_str) if isinstance(body_str, str) else body_str

            pk = f"ORG#{org_id}"
            sk = f"JOB#{job_id_param}"
            existing = db_client.get_item(pk, sk)

            if not existing:
                raise NotFoundError(f"Service job '{job_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, existing["organizationId"])

            new_status = payload.get("status", "COMPLETED" if path.endswith("/complete") else existing["status"]).upper()

            # Enforce state machine status transitions
            validate_job_status_transition(existing["status"], new_status)

            updates = {
                "status": new_status,
                "GSI1PK": f"ORG#{org_id}#JOB_STATUS#{new_status}"
            }

            updated_job = db_client.update_item(pk, sk, updates)
            return build_success_response(clean_dynamodb_keys(updated_job), 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
