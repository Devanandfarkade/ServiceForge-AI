"""
ServiceForge AI — Single-Table Data Model Helper
Constructs DynamoDB item dicts conforming strictly to docs/DATABASE_SPEC.md.
"""

from datetime import datetime, timezone
import uuid

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def build_service_request_item(org_id: str, user_id: str, description: str, description_source: str, priority: str = "HIGH", customer_id: str = None, asset_id: str = None, attachments: list = None, ticket_number: str = None, request_id: str = None) -> dict:
    req_id = request_id or str(uuid.uuid4())
    tkt_num = ticket_number or f"REQ-2026-{str(uuid.uuid4())[:4].upper()}"
    ts = now_iso()
    prio = priority.upper()
    
    # Process attachments list to store attachment IDs
    att_ids = []
    if attachments:
        for att in attachments:
            if isinstance(att, str):
                att_ids.append(att)
            elif isinstance(att, dict) and "attachmentId" in att:
                att_ids.append(att["attachmentId"])
            elif isinstance(att, dict) and "id" in att:
                att_ids.append(att["id"])

    item = {
        "PK": f"ORG#{org_id}",
        "SK": f"REQ#{req_id}",
        "GSI1PK": f"ORG#{org_id}#STATUS#SUBMITTED",
        "GSI1SK": f"CREATED#{ts}",
        "GSI2PK": f"ORG#{org_id}#PRIORITY#{prio}",
        "GSI2SK": f"CREATED#{ts}",
        "organizationId": org_id,
        "requestId": req_id,
        "ticketNumber": tkt_num,
        "customerId": customer_id or "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "assetId": asset_id or "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
        "submittedByUserId": user_id,
        "description": description,
        "descriptionSource": description_source,  # 'typed' | 'voice' | 'edited_voice'
        "attachments": att_ids,
        "status": "SUBMITTED",
        "priority": prio,
        "createdAt": ts,
        "updatedAt": ts
    }
    return item

def build_attachment_item(org_id: str, entity_id: str, file_name: str, content_type: str, size_bytes: int, s3_object_key: str, s3_bucket: str, entity_type: str = "SERVICE_REQUEST", uploaded_by: str = None, attachment_id: str = None) -> dict:
    att_id = attachment_id or f"att-{str(uuid.uuid4())[:8]}"
    ts = now_iso()
    ent_id = entity_id or "pending"

    item = {
        "PK": f"ORG#{org_id}",
        "SK": f"ATTACHMENT#{ent_id}#{att_id}",
        "GSI1PK": f"ORG#{org_id}#S3KEY#{s3_object_key}",
        "GSI1SK": "METADATA",
        "organizationId": org_id,
        "attachmentId": att_id,
        "entityType": entity_type,
        "entityId": ent_id,
        "fileName": file_name,
        "contentType": content_type,
        "sizeBytes": size_bytes,
        "s3Bucket": s3_bucket,
        "s3ObjectKey": s3_object_key,
        "status": "PRESIGNED",  # PRESIGNED | ACTIVE
        "uploadedBy": uploaded_by or "system",
        "createdAt": ts,
        "uploadedAt": ts
    }
    return item

def build_service_job_item(org_id: str, request_id: str, title: str, priority: str = "HIGH", customer_id: str = None, asset_id: str = None, target_sla_deadline: str = None, job_id: str = None, job_number: str = None) -> dict:
    j_id = job_id or str(uuid.uuid4())
    j_num = job_number or f"JOB-2026-{str(uuid.uuid4())[:4].upper()}"
    ts = now_iso()
    sla = target_sla_deadline or ts

    item = {
        "PK": f"ORG#{org_id}",
        "SK": f"JOB#{j_id}",
        "GSI1PK": f"ORG#{org_id}#JOB_STATUS#UNASSIGNED",
        "GSI1SK": f"SLA#{sla}",
        "organizationId": org_id,
        "jobId": j_id,
        "jobIdNumber": j_num,
        "requestId": request_id,
        "customerId": customer_id or "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "assetId": asset_id or "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
        "title": title,
        "priority": priority.upper(),
        "status": "UNASSIGNED",
        "assignedTechnicianId": None,
        "targetSlaDeadline": sla,
        "createdAt": ts,
        "updatedAt": ts
    }
    return item

def build_job_assignment_item(org_id: str, job_id: str, technician_id: str, assigned_by_user_id: str, scheduled_start_time: str = None) -> dict:
    ts = now_iso()
    item = {
        "PK": f"ORG#{org_id}",
        "SK": f"ASSIGN#{job_id}#{technician_id}",
        "GSI1PK": f"ORG#{org_id}#TECH#{technician_id}",
        "GSI1SK": f"ASSIGNED#{ts}",
        "organizationId": org_id,
        "jobId": job_id,
        "technicianId": technician_id,
        "assignedByUserId": assigned_by_user_id,
        "scheduledStartTime": scheduled_start_time or ts,
        "status": "PENDING",
        "assignedAt": ts
    }
    return item

def build_job_update_item(org_id: str, job_id: str, technician_id: str, update_type: str, notes: str = "", step_number_completed: int = None, parts_used: list = None) -> dict:
    ts = now_iso()
    u_id = str(uuid.uuid4())
    item = {
        "PK": f"ORG#{org_id}",
        "SK": f"UPDATE#{job_id}#{ts}",
        "GSI1PK": f"ORG#{org_id}#JOB_UPDATES",
        "GSI1SK": f"JOB#{job_id}#{ts}",
        "organizationId": org_id,
        "updateId": u_id,
        "jobId": job_id,
        "technicianId": technician_id,
        "updateType": update_type,
        "stepNumberCompleted": step_number_completed,
        "notes": notes,
        "partsUsed": parts_used or [],
        "timestamp": ts
    }
    return item

def clean_dynamodb_keys(item: dict) -> dict:
    """
    Removes DynamoDB partition/sort key overhead (PK, SK, GSI1PK, etc.) before returning JSON responses.
    """
    if not isinstance(item, dict):
        return item
    cleaned = dict(item)
    for key in ["PK", "SK", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK"]:
        cleaned.pop(key, None)
    return cleaned
