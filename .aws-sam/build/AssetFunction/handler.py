"""
ServiceForge AI — Asset Microservice Lambda Handler
Handles retrieving equipment/asset master records filtered by tenant and customer organization.
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

# Fallback seed assets for demo organization
MOCK_SEED_ASSETS = [
    {
        "assetId": "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
        "organizationId": "org-8841-alpha",
        "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "name": "Industrial Air Compressor AC-4500",
        "equipmentType": "Heavy Duty Rotary Screw Compressor",
        "serialNumber": "AC-4500-8841-X",
        "modelNumber": "Atlas Copco GA45+",
        "location": "Building B - Main Compressor Room",
        "installationDate": "2021-06-15",
        "status": "OPERATIONAL",
        "lastMaintenanceDate": "2026-01-10"
    },
    {
        "assetId": "asset-chiller",
        "organizationId": "org-8841-alpha",
        "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "name": "Chiller Unit Modular Chill-90",
        "equipmentType": "Air-Cooled Water Chiller 90-Ton",
        "serialNumber": "CHILL-90-2022-09",
        "modelNumber": "Trane CGAM-090",
        "location": "Rooftop HVAC Deck 2",
        "installationDate": "2022-09-01",
        "status": "REQUIRES_SERVICE",
        "lastMaintenanceDate": "2025-11-20"
    },
    {
        "assetId": "asset-conveyor",
        "organizationId": "org-8841-alpha",
        "customerId": "cust-vanguard",
        "name": "High-Capacity Conveyor Drive System",
        "equipmentType": "Automated Parcel Sorting Conveyor",
        "serialNumber": "CONV-VANG-771",
        "modelNumber": "Interroll Modular 3000",
        "location": "Distribution Center A - Sorting Line 4",
        "installationDate": "2023-03-12",
        "status": "OPERATIONAL",
        "lastMaintenanceDate": "2026-02-01"
    },
    {
        "assetId": "asset-generator",
        "organizationId": "org-8841-alpha",
        "customerId": "cust-titan",
        "name": "Backup Diesel Generator 500kW",
        "equipmentType": "Standby Power Generator",
        "serialNumber": "GEN-TITAN-500",
        "modelNumber": "Cummins C500D5e",
        "location": "Substation Enclosure South",
        "installationDate": "2020-11-05",
        "status": "OPERATIONAL",
        "lastMaintenanceDate": "2026-02-15"
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

        path = event.get("path") or event.get("rawPath", "/assets")
        path_parameters = event.get("pathParameters") or {}
        asset_id_param = path_parameters.get("id")

        logger.info(
            f"Asset API Invoked: {http_method} {path}",
            request_id=request_id,
            org_id=org_id,
            user_id=user_id,
            role=role,
            operation=f"Asset.{http_method}"
        )

        require_role(user_ctx, ["ADMIN", "SERVICE_MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"])

        # ----------------------------------------------------------------------
        # 1. GET /assets — List Assets (Optionally filtered by customerId)
        # ----------------------------------------------------------------------
        if http_method == "GET" and not asset_id_param:
            query_params = event.get("queryStringParameters") or {}
            cust_filter = query_params.get("customerId")

            if cust_filter:
                items = db_client.query(
                    gsi_name="GSI1",
                    gsi_pk=f"ORG#{org_id}#CUST#{cust_filter}"
                )
                if not items:
                    # Filter seed data
                    filtered_seed = [clean_dynamodb_keys(item) for item in MOCK_SEED_ASSETS if item["customerId"] == cust_filter]
                    return build_success_response(filtered_seed, 200, request_id)
            else:
                items = db_client.query(
                    pk=f"ORG#{org_id}",
                    sk_prefix="ASSET#"
                )
                if not items:
                    cleaned_seed = [clean_dynamodb_keys(item) for item in MOCK_SEED_ASSETS]
                    return build_success_response(cleaned_seed, 200, request_id)

            cleaned_items = [clean_dynamodb_keys(item) for item in items]
            return build_success_response(cleaned_items, 200, request_id)

        # ----------------------------------------------------------------------
        # 2. GET /assets/{id} — Retrieve Specific Asset
        # ----------------------------------------------------------------------
        elif http_method == "GET" and asset_id_param:
            pk = f"ORG#{org_id}"
            sk = f"ASSET#{asset_id_param}"
            item = db_client.get_item(pk, sk)

            if not item:
                for seed in MOCK_SEED_ASSETS:
                    if seed["assetId"] == asset_id_param:
                        return build_success_response(seed, 200, request_id)
                raise NotFoundError(f"Asset '{asset_id_param}' not found in user organization.")

            verify_tenant_access(user_ctx, item["organizationId"])
            return build_success_response(clean_dynamodb_keys(item), 200, request_id)

        else:
            return build_error_response(405, f"Method {http_method} not allowed on {path}", "METHOD_NOT_ALLOWED", request_id=request_id)

    except Exception as e:
        return handle_exception(e, request_id)
