"""
ServiceForge AI — Centralized Input Validation Module
Provides validation rules for service requests, attachments, jobs, and status transitions.
"""

import os
import re
from shared.config import Config
from shared.errors import ValidationError, ConflictError

VALID_DESCRIPTION_SOURCES = {"typed", "voice", "edited_voice"}
VALID_PRIORITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
VALID_REQUEST_STATUSES = {"SUBMITTED", "AI_ANALYZING", "PENDING_REVIEW", "APPROVED", "REJECTED"}
VALID_JOB_STATUSES = {"UNASSIGNED", "ASSIGNED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED"}

# Documented valid state transitions for ServiceJob
JOB_STATUS_TRANSITIONS = {
    "UNASSIGNED": {"ASSIGNED", "COMPLETED"},
    "ASSIGNED": {"EN_ROUTE", "IN_PROGRESS", "UNASSIGNED"},
    "EN_ROUTE": {"IN_PROGRESS", "COMPLETED"},
    "IN_PROGRESS": {"COMPLETED"},
    "COMPLETED": set()  # Terminal state
}

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes filenames to prevent path traversal vulnerabilities.
    Strips directory separators, null bytes, and leading dots.
    """
    if not filename:
        return "unnamed_file"
    
    # Remove path components
    basename = os.path.basename(filename).replace("\\", "/").split("/")[-1]
    
    # Remove traversal sequences
    basename = basename.replace("..", "").strip()
    
    # Keep only safe alphanumeric, dots, underscores, dashes
    basename = re.sub(r'[^a-zA-Z0-9_\.\-]', '_', basename)
    
    if not basename or basename.startswith('.'):
        return f"file_{basename.lstrip('.') or 'attachment'}"
        
    return basename

def validate_service_request_input(payload: dict) -> dict:
    """
    Validates Service Request creation payload.
    """
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object.")

    description = payload.get("description") or payload.get("rawDescription")
    if not description or not isinstance(description, str) or not description.strip():
        raise ValidationError(
            message="Required field 'description' cannot be empty.",
            details=[{"field": "description", "issue": "Must be a non-empty string."}]
        )

    description_source = payload.get("descriptionSource", "typed")
    if description_source not in VALID_DESCRIPTION_SOURCES:
        raise ValidationError(
            message=f"Invalid 'descriptionSource': '{description_source}'.",
            details=[{"field": "descriptionSource", "issue": f"Allowed values: {list(VALID_DESCRIPTION_SOURCES)}"}]
        )

    priority = payload.get("priority", "HIGH").upper()
    if priority not in VALID_PRIORITIES:
        raise ValidationError(
            message=f"Invalid 'priority': '{priority}'.",
            details=[{"field": "priority", "issue": f"Allowed values: {list(VALID_PRIORITIES)}"}]
        )

    attachments = payload.get("attachments", [])
    if not isinstance(attachments, list):
        raise ValidationError("Field 'attachments' must be a list.")

    if len(attachments) > Config.MAX_ATTACHMENTS_PER_REQUEST:
        raise ValidationError(
            message=f"Maximum attachment limit exceeded ({len(attachments)} > {Config.MAX_ATTACHMENTS_PER_REQUEST}).",
            details=[{"field": "attachments", "issue": f"Max {Config.MAX_ATTACHMENTS_PER_REQUEST} attachments allowed per request."}]
        )

    return {
        "description": description.strip(),
        "descriptionSource": description_source,
        "priority": priority,
        "attachments": attachments,
        "customerId": payload.get("customerId"),
        "assetId": payload.get("assetId"),
        "channel": payload.get("channel", "WEB_PORTAL")
    }

def validate_attachment_presign_input(payload: dict, current_attachment_count: int = 0) -> dict:
    """
    Validates Attachment presigned URL request payload.
    """
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object.")

    filename = payload.get("fileName") or payload.get("filename")
    if not filename or not isinstance(filename, str) or not filename.strip():
        raise ValidationError(
            message="Required field 'fileName' cannot be empty.",
            details=[{"field": "fileName", "issue": "Filename is required."}]
        )

    sanitized_name = sanitize_filename(filename)

    # Validate file extension
    ext = sanitized_name.split('.')[-1].lower() if '.' in sanitized_name else ""
    if ext in Config.PROHIBITED_EXTENSIONS:
        raise ValidationError(
            message=f"File extension '.{ext}' is strictly prohibited for security reasons.",
            details=[{"field": "fileName", "issue": "Prohibited file type executable/script."}]
        )

    content_type = (payload.get("contentType") or payload.get("mimeType") or "").lower()
    if not content_type or content_type not in Config.ALLOWED_MIME_TYPES:
        raise ValidationError(
            message=f"MIME type '{content_type}' is not allowed.",
            details=[{"field": "contentType", "issue": f"Allowed MIME types: {sorted(list(Config.ALLOWED_MIME_TYPES))}"}]
        )

    size_bytes = payload.get("sizeBytes") or payload.get("size")
    if size_bytes is None or not isinstance(size_bytes, (int, float)):
        raise ValidationError(
            message="Required numeric field 'sizeBytes' is missing or invalid.",
            details=[{"field": "sizeBytes", "issue": "Must be an integer in bytes."}]
        )

    if size_bytes > Config.MAX_FILE_SIZE_BYTES:
        raise ValidationError(
            message=f"File size exceeds maximum allowed limit ({size_bytes} > {Config.MAX_FILE_SIZE_BYTES} bytes / 15 MB).",
            details=[{"field": "sizeBytes", "issue": f"Maximum allowed file size is 15 MB ({Config.MAX_FILE_SIZE_BYTES} bytes)."}]
        )

    if current_attachment_count >= Config.MAX_ATTACHMENTS_PER_REQUEST:
        raise ValidationError(
            message=f"Maximum attachment limit of {Config.MAX_ATTACHMENTS_PER_REQUEST} per request reached.",
            details=[{"field": "attachments", "issue": "Cannot attach more files."}]
        )

    return {
        "fileName": sanitized_name,
        "contentType": content_type,
        "sizeBytes": int(size_bytes),
        "serviceRequestId": payload.get("serviceRequestId"),
        "entityType": payload.get("entityType", "SERVICE_REQUEST")
    }

def validate_job_status_transition(current_status: str, new_status: str) -> None:
    """
    Validates state machine status transitions for ServiceJobs.
    Raises ConflictError (409) if transition is invalid.
    """
    if current_status == new_status:
        return

    allowed = JOB_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise ConflictError(
            message=f"Invalid job status transition from '{current_status}' to '{new_status}'. Allowed transitions: {list(allowed)}",
            code="INVALID_STATE_TRANSITION"
        )
