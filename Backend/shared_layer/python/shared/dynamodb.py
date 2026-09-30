"""
ServiceForge AI — Reusable DynamoDB Client & Data Access Layer
Provides Single-Table Design access patterns (GetItem, PutItem, UpdateItem, DeleteItem, Query)
with in-memory fallback datastore for unit tests when live AWS is unavailable.
"""

import os
import boto3
from botocore.exceptions import ClientError
from shared.config import Config
from shared.logging_utils import logger

# Global in-memory storage for unit tests / offline mock mode
_IN_MEMORY_TABLE = {}

class DynamoDBClient:
    def __init__(self):
        self.table_name = Config.DYNAMODB_TABLE_NAME
        self.region = Config.AWS_REGION
        self.resource = None
        self.table = None
        self.use_mock = False

        # Attempt to initialize boto3 DynamoDB resource
        try:
            # Check if running in AWS Lambda or if credentials present
            if os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("AWS_ACCESS_KEY_ID"):
                self.resource = boto3.resource("dynamodb", region_name=self.region)
                self.table = self.resource.Table(self.table_name)
            else:
                self.use_mock = True
        except Exception as e:
            logger.warning(f"Could not connect to live DynamoDB ({e}). Falling back to in-memory store.")
            self.use_mock = True

    def get_item(self, pk: str, sk: str) -> dict | None:
        if self.use_mock:
            key = f"{pk}#{sk}"
            return _IN_MEMORY_TABLE.get(key)
        try:
            response = self.table.get_item(Key={"PK": pk, "SK": sk})
            return response.get("Item")
        except ClientError as e:
            logger.error(f"DynamoDB get_item error for PK={pk}, SK={sk}: {e}")
            raise

    def put_item(self, item: dict) -> dict:
        if self.use_mock:
            key = f"{item['PK']}#{item['SK']}"
            _IN_MEMORY_TABLE[key] = dict(item)
            return item
        try:
            self.table.put_item(Item=item)
            return item
        except ClientError as e:
            logger.error(f"DynamoDB put_item error for PK={item.get('PK')}: {e}")
            raise

    def query(self, pk: str = None, sk_prefix: str = None, gsi_name: str = None, gsi_pk: str = None, gsi_sk_prefix: str = None) -> list:
        if self.use_mock:
            results = []
            for item in _IN_MEMORY_TABLE.values():
                match = True
                if gsi_name == "GSI1":
                    if gsi_pk and item.get("GSI1PK") != gsi_pk:
                        match = False
                    if gsi_sk_prefix and not item.get("GSI1SK", "").startswith(gsi_sk_prefix):
                        match = False
                elif gsi_name == "GSI2":
                    if gsi_pk and item.get("GSI2PK") != gsi_pk:
                        match = False
                    if gsi_sk_prefix and not item.get("GSI2SK", "").startswith(gsi_sk_prefix):
                        match = False
                else:
                    if pk and item.get("PK") != pk:
                        match = False
                    if sk_prefix and not item.get("SK", "").startswith(sk_prefix):
                        match = False
                if match:
                    results.append(dict(item))
            return results

        try:
            from boto3.dynamodb.conditions import Key
            if gsi_name:
                pk_attr = "GSI1PK" if gsi_name == "GSI1" else "GSI2PK"
                sk_attr = "GSI1SK" if gsi_name == "GSI1" else "GSI2SK"
                key_expr = Key(pk_attr).eq(gsi_pk)
                if gsi_sk_prefix:
                    key_expr = key_expr & Key(sk_attr).begins_with(gsi_sk_prefix)
                response = self.table.query(IndexName=gsi_name, KeyConditionExpression=key_expr)
            else:
                key_expr = Key("PK").eq(pk)
                if sk_prefix:
                    key_expr = key_expr & Key("SK").begins_with(sk_prefix)
                response = self.table.query(KeyConditionExpression=key_expr)
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"DynamoDB query error: {e}")
            raise

    def update_item(self, pk: str, sk: str, updates: dict) -> dict | None:
        if self.use_mock:
            key = f"{pk}#{sk}"
            if key in _IN_MEMORY_TABLE:
                _IN_MEMORY_TABLE[key].update(updates)
                return _IN_MEMORY_TABLE[key]
            return None

        try:
            update_expression = "SET " + ", ".join([f"#{k} = :{k}" for k in updates.keys()])
            expression_attribute_names = {f"#{k}": k for k in updates.keys()}
            expression_attribute_values = {f":{k}": v for k, v in updates.items()}

            response = self.table.update_item(
                Key={"PK": pk, "SK": sk},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW"
            )
            return response.get("Attributes")
        except ClientError as e:
            logger.error(f"DynamoDB update_item error for PK={pk}, SK={sk}: {e}")
            raise

    def delete_item(self, pk: str, sk: str) -> bool:
        if self.use_mock:
            key = f"{pk}#{sk}"
            if key in _IN_MEMORY_TABLE:
                del _IN_MEMORY_TABLE[key]
                return True
            return False

        try:
            self.table.delete_item(Key={"PK": pk, "SK": sk})
            return True
        except ClientError as e:
            logger.error(f"DynamoDB delete_item error for PK={pk}, SK={sk}: {e}")
            raise

# Singleton instance
db_client = DynamoDBClient()
