"""
ServiceForge AI — Shared Environment Configuration
Loads non-sensitive environment variables for Lambda functions.
"""

import os

class Config:
    AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
    BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
    DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "ServiceForge_CoreTable")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "serviceforge-ai-attachments-ap-south-1")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
