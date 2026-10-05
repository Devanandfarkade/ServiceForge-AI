"""
ServiceForge AI — Image Processing & Conversion Utility
Provides in-memory HEIC to JPEG conversion conforming to docs/AI_SPEC.md and security rules.
"""

import io
import pillow_heif
from PIL import Image
from shared.errors import ServiceForgeError
from shared.logging_utils import logger

# Register HEIF opener for Pillow
pillow_heif.register_heif_opener()

def convert_heic_to_jpeg(image_bytes: bytes, max_file_size_bytes: int = 15 * 1024 * 1024) -> bytes:
    """
    Converts HEIC image bytes to standard RGB JPEG bytes in memory.
    Preserves original S3 objects and enforces memory and security limits.
    """
    if not image_bytes:
        raise ServiceForgeError(
            "Empty attachment payload provided for HEIC conversion.",
            status_code=400,
            code="INVALID_ATTACHMENT"
        )

    if len(image_bytes) > max_file_size_bytes:
        raise ServiceForgeError(
            "Attachment exceeds maximum allowed 15MB conversion threshold.",
            status_code=400,
            code="ATTACHMENT_TOO_LARGE"
        )

    try:
        Image.MAX_IMAGE_PIXELS = 25_000_000  # Security limit against decompression bomb attacks
        with Image.open(io.BytesIO(image_bytes)) as img:
            output_buffer = io.BytesIO()
            rgb_img = img.convert("RGB")
            rgb_img.save(output_buffer, format="JPEG", quality=85, optimize=True)
            jpeg_bytes = output_buffer.getvalue()
            return jpeg_bytes
    except Exception as err:
        logger.error(f"HEIC image conversion failed: {err}")
        raise ServiceForgeError(
            "Failed to decode or convert HEIC image attachment.",
            status_code=400,
            code="IMAGE_CONVERSION_ERROR"
        )
