"""
ServiceForge AI — Shared Response Alias Module
Re-exports functions from shared.responses to maintain backward compatibility.
"""

from shared.responses import (
    build_response,
    build_success_response,
    build_error_response,
    extract_request_id,
    handle_exception,
    COMMON_HEADERS
)
