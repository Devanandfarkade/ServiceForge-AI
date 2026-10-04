"""
ServiceForge AI — S3 Helper & Presigned Upload Utility
Generates tenant-isolated S3 object keys and short-lived presigned PUT/GET URLs.
"""

import os
import boto3
from botocore.exceptions import ClientError
from shared.config import Config
from shared.logging_utils import logger

class S3Client:
    def __init__(self):
        self.bucket_name = Config.S3_BUCKET_NAME
        self.region = Config.AWS_REGION
        self.client = None
        self.use_mock = False

        try:
            if os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("AWS_ACCESS_KEY_ID"):
                self.client = boto3.client("s3", region_name=self.region)
            else:
                self.use_mock = True
        except Exception as e:
            logger.warning(f"Could not connect to live S3 ({e}). Using mock presigned URL generator.")
            self.use_mock = True

    def build_tenant_object_key(self, org_id: str, request_id: str, attachment_id: str, filename: str) -> str:
        """
        Constructs a tenant-isolated S3 object key:
        attachments/orgs/<orgId>/requests/<requestId>/<attachmentId>/<fileName>
        """
        req = request_id or "general"
        att = attachment_id or "file"
        return f"attachments/orgs/{org_id}/requests/{req}/{att}/{filename}"

    def generate_presigned_put_url(self, object_key: str, content_type: str = None, expires_in: int = Config.PRESIGNED_URL_EXPIRATION_SECONDS) -> str:
        """
        Generates a 15-minute S3 presigned PUT URL for direct client binary uploads.
        Note: ContentType is omitted from Params to prevent header-signing mismatch (403 Forbidden) errors in browser uploads.
        """
        if self.use_mock:
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{object_key}?mock-presigned=true&expires={expires_in}"

        try:
            url = self.client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_key
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned PUT URL for {object_key}: {e}")
            raise

    def generate_presigned_get_url(self, object_key: str, expires_in: int = Config.PRESIGNED_URL_EXPIRATION_SECONDS, content_type: str = None) -> str:
        """
        Generates a 15-minute S3 presigned GET URL for secure attachment download.
        """
        if self.use_mock:
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{object_key}?mock-download=true&expires={expires_in}"

        try:
            params = {
                "Bucket": self.bucket_name,
                "Key": object_key
            }
            if content_type:
                params["ResponseContentType"] = content_type
            url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned GET URL for {object_key}: {e}")
            raise

    def check_object_exists(self, object_key: str) -> bool:
        """
        Checks whether an object exists in the S3 bucket using head_object.
        """
        if self.use_mock:
            return True
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code in ["404", "NoSuchKey", "NotFound"]:
                return False
            logger.warning(f"S3 head_object warning for key '{object_key}': {e}")
            return True

    def get_object_bytes(self, object_key: str) -> bytes:
        """
        Retrieves raw object bytes directly from S3 bucket for internal processing (e.g. Bedrock analysis).
        """
        if self.use_mock:
            return b""
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=object_key)
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"Error fetching object bytes for {object_key}: {e}")
            raise

s3_client = S3Client()
