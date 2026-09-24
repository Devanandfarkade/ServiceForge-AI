"""
ServiceForge AI — Structured Logging Utility
Provides structured JSON logging for AWS Lambda execution with automatic context sanitization.
"""

import json
import logging
import os
import sys

# Redacted keys list to prevent sensitive information leakage in CloudWatch
SENSITIVE_KEYS = {
    "authorization",
    "password",
    "token",
    "access_key",
    "secret",
    "secret_key",
    "x-api-key",
    "x-amz-security-token",
    "bearer",
    "credentials",
    "private_key"
}

def sanitize_data(data):
    """
    Recursively redacts sensitive fields from dictionary or list payloads.
    """
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            if any(s in key.lower() for s in SENSITIVE_KEYS):
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = sanitize_data(value)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return data

class StructuredLogger:
    def __init__(self, name="ServiceForgeAI"):
        self.logger = logging.getLogger(name)
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        self.logger.setLevel(getattr(logging, log_level, logging.INFO))
        
        # Ensure single handler to avoid duplicate logs in AWS Lambda runtime
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter("%(message)s"))
            self.logger.addHandler(handler)

    def _log(self, level, message, request_id=None, org_id=None, user_id=None, role=None, operation=None, extra_data=None):
        log_entry = {
            "level": level,
            "message": message,
            "requestId": request_id or "N/A",
            "organizationId": org_id or "N/A",
            "userId": user_id or "N/A",
            "role": role or "N/A",
            "operation": operation or "N/A"
        }
        if extra_data:
            log_entry["data"] = sanitize_data(extra_data)

        log_json = json.dumps(log_entry)
        if level == "INFO":
            self.logger.info(log_json)
        elif level == "WARNING":
            self.logger.warning(log_json)
        elif level == "ERROR":
            self.logger.error(log_json)
        elif level == "DEBUG":
            self.logger.debug(log_json)

    def info(self, message, **kwargs):
        self._log("INFO", message, **kwargs)

    def warning(self, message, **kwargs):
        self._log("WARNING", message, **kwargs)

    def error(self, message, **kwargs):
        self._log("ERROR", message, **kwargs)

    def debug(self, message, **kwargs):
        self._log("DEBUG", message, **kwargs)

logger = StructuredLogger()
