"""
ServiceForge AI — Custom Application Exceptions
Defines standardized exception hierarchy mapped to HTTP status codes and error response payloads.
"""

class ServiceForgeError(Exception):
    def __init__(self, message: str, status_code: int = 500, code: str = "INTERNAL_ERROR", details: list = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or []

    def to_dict(self):
        err = {
            "code": self.code,
            "message": self.message
        }
        if self.details:
            err["details"] = self.details
        return err


class ValidationError(ServiceForgeError):
    def __init__(self, message: str, details: list = None):
        super().__init__(message=message, status_code=400, code="INVALID_INPUT", details=details)


class AuthenticationError(ServiceForgeError):
    def __init__(self, message: str = "Authentication token missing or invalid."):
        super().__init__(message=message, status_code=401, code="INVALID_TOKEN")


class AuthorizationError(ServiceForgeError):
    def __init__(self, message: str = "Access denied for this organization or user role."):
        super().__init__(message=message, status_code=403, code="ACCESS_DENIED")


class NotFoundError(ServiceForgeError):
    def __init__(self, message: str = "Target resource not found in user organization."):
        super().__init__(message=message, status_code=404, code="RESOURCE_NOT_FOUND")


class ConflictError(ServiceForgeError):
    def __init__(self, message: str = "Invalid status transition or entity conflict.", code: str = "INVALID_STATE_TRANSITION"):
        super().__init__(message=message, status_code=409, code=code)
