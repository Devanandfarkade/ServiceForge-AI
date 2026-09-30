"""
ServiceForge AI — Shared Backend Package Initialization
"""

from .response import build_response, build_error_response
from .config import Config

__all__ = ["build_response", "build_error_response", "Config"]
