"""
ServiceForge AI — Unit Tests: Image Processing & HEIC Conversion Utility
"""

import sys
import os
import io
import pytest
from PIL import Image
import pillow_heif

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from shared.image_utils import convert_heic_to_jpeg
from shared.errors import ServiceForgeError

# Ensure HEIF opener is registered
pillow_heif.register_heif_opener()

def _create_sample_heic_bytes() -> bytes:
    """Generates a small in-memory HEIC image byte sequence for testing."""
    img = Image.new("RGB", (20, 20), color="red")
    buf = io.BytesIO()
    heif_file = pillow_heif.from_pillow(img)
    heif_file.save(buf)
    return buf.getvalue()

def _create_sample_jpeg_bytes() -> bytes:
    """Generates a small in-memory JPEG image byte sequence for testing."""
    img = Image.new("RGB", (20, 20), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_convert_heic_to_jpeg_success():
    import time
    heic_bytes = _create_sample_heic_bytes()
    assert len(heic_bytes) > 0

    start_t = time.time()
    jpeg_bytes = convert_heic_to_jpeg(heic_bytes)
    conversion_ms = (time.time() - start_t) * 1000

    assert isinstance(jpeg_bytes, bytes)
    assert len(jpeg_bytes) > 0
    # Check JPEG magic bytes \xFF \xD8
    assert jpeg_bytes[:2] == b"\xff\xd8"

    # Verify PIL can open the converted JPEG
    converted_img = Image.open(io.BytesIO(jpeg_bytes))
    assert converted_img.format == "JPEG"
    assert converted_img.size == (20, 20)
    assert conversion_ms < 500.0  # Sample fixture conversion completes in under 500ms

def test_convert_heic_empty_bytes_raises_error():
    with pytest.raises(ServiceForgeError) as exc_info:
        convert_heic_to_jpeg(b"")

    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "INVALID_ATTACHMENT"
    assert "Empty attachment" in str(exc_info.value)

def test_convert_heic_oversized_payload_raises_error():
    fake_huge_bytes = b"0" * (15 * 1024 * 1024 + 1)
    with pytest.raises(ServiceForgeError) as exc_info:
        convert_heic_to_jpeg(fake_huge_bytes)

    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "ATTACHMENT_TOO_LARGE"
    assert "15MB" in str(exc_info.value)

def test_convert_heic_invalid_corrupted_bytes_raises_error():
    corrupted_bytes = b"NOT_A_REAL_HEIC_FILE_HEADER_BYTES_12345"
    with pytest.raises(ServiceForgeError) as exc_info:
        convert_heic_to_jpeg(corrupted_bytes)

    assert exc_info.value.status_code == 400
    assert exc_info.value.code == "IMAGE_CONVERSION_ERROR"
    assert "Failed to decode" in str(exc_info.value)

def test_existing_jpeg_png_webp_unaffected():
    jpeg_bytes = _create_sample_jpeg_bytes()
    assert jpeg_bytes[:2] == b"\xff\xd8"
    # Existing formats bypass convert_heic_to_jpeg in application flow
    converted = convert_heic_to_jpeg(jpeg_bytes)
    assert converted[:2] == b"\xff\xd8"
