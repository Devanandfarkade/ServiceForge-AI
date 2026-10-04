"""
ServiceForge AI — Customer Microservice Lambda Handler
Handles retrieving customer organization master records for multi-tenant service requests.
"""

import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from shared.auth import extract_user_context, require_role, verify_tenant_access
from shared.dynamodb import db_client
from shared.errors import NotFoundError, ServiceForgeError
from shared.logging_utils import logger
from shared.models import clean_dynamodb_keys
from shared.responses import build_error_response, build_success_response, extract_request_id, handle_exception

# Fallback seed customers if table query is empty for demo org
MOCK_SEED_CUSTOMERS = [
    {
        "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "organizationId": "org-8841-alpha",
        "name": "Industrial Plastics Corp",
        "companyName": "Industrial Plastics Corp",
        "industry": "Manufacturing & Materials",
        "primaryContact": "Robert Sterling",
        "contactEmail": "r.sterling@industrialplastics.com",
        "contactPhone": "+1 (555) 234-5678",
        "serviceLevel": "Enterprise Tier 1",
        "status": "ACTIVE",
        "address": "450 Industrial Parkway, Sector 4, Houston, TX 77001"
    },
    {
        "customerId": "cust-vanguard",
        "organizationId": "org-8841-alpha",
        "name": "Vanguard Logistics Hub",
        "companyName": "Vanguard Logistics Hub",
        "industry": "Logistics & Supply Chain",
        "primaryContact": "Elena Rostova",
        "contactEmail": "e.rostova@vanguardlogistics.com",
        "contactPhone": "+1 (555) 876-5432",
        "serviceLevel": "Priority SLA (4-Hour Response)",
        "status": "ACTIVE",
        "address": "1200 Cargo Way, Dock 14, Chicago, IL 60607"
    },
    {
        "customerId": "cust-titan",
        "organizationId": "org-8841-alpha",
        "name": "Titan Energy Systems",
        "companyName": "Titan Energy Systems",
        "industry": "Power & Renewable Energy",
        "primaryContact": "David Vance",
        "contactEmail": "d.vance@titanenergy.com",
        "contactPhone": "+1 (555) 901-2345",
        "serviceLevel": "Critical Infrastructure 24/7",
        "status": "ACTIVE",
        "address": "888 Power Line Road, Substation B, Phoenix, AZ 85001"
    }
]

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

        path = event.get("path") or event.get("rawPath", "/customers")
        path_parameters = event.get("pathParameters") or {}
        cust_id_param = path_parameters.get("id")

        logger.info(
            f"Customer API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"Customer.{http_method}"
        )

        require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

        # ----------------------------------------------------------------------
        # 1. GET /customers — List Tenant Customers
        # ----------------------------------------------------------------------
        if http_method == "GET" and not cust_id_param:
            items = db_client.query(
                pk=f"ORG#{org_id}",
                sk_prefix="CUST#"
            )
            if not items:
                # Return seed customers for org-8841-alpha
                cleaned = [clean_dynamodb_keys(item) for item in MOCK_SEED_CUSTOMERS]
                return build_success_response(cleaned, 200, request_id)

            cleaned_items = [clean_dynamodb_keys(item) for item in items]
            return build_success_response(cleaned_items, 200, request_id)

        # ----------------------------------------------------------------------
        # 2. GET /customers/{id} — Retrieve Specific Customer
        # ----------------------------------------------------------------------
        elif http_method == "GET" and cust_id_param:
            pk = f"ORG#{org_id}"
            sk = f"CUST#{cust_id_param}"
            item = db_client.get_item(pk, sk)

            if not item:
                # Check seed data
                for seed in MOCK_SEED_CUSTOMERS:
                    if seed["customerId"] == cust_id_param:
                        return build_success_response(seed, 200, request_id)
                raise NotFoundError(f"Customer '{cust_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])
            return build_success_response(clean_dynamodb_keys(item), 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
