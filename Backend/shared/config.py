"""
ServiceForge AI — Shared Environment Configuration
Loads non-sensitive environment variables and system constants for Lambda functions.
"""

import os

class Config:
    AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "prod")
    DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "ServiceForge")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "serviceforge-ai-attachments-ap-south-1")
    BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Attachment Validation Governance Constants
    MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
    MAX_ATTACHMENTS_PER_REQUEST = 10
    PRESIGNED_URL_EXPIRATION_SECONDS = 900  # 15 minutes

    ALLOWED_MIME_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "application/pdf",
        "text/plain",
        "text/csv"
    }

    ALLOWED_EXTENSIONS = {
        "jpg", "jpeg", "png", "webp", "heic", "pdf", "txt", "csv"
    }

    PROHIBITED_EXTENSIONS = {
        "exe", "bat", "cmd", "sh", "js", "vbs", "zip", "tar", "gz", "7z", "iso", "dll", "ps1"
    }

