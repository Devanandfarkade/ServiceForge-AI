# ServiceForge AI — Python Backend Foundation

## Overview
The ServiceForge AI backend is a serverless, event-driven microservices architecture built for deployment on **AWS Lambda** and integration with **Amazon API Gateway**, **Amazon Bedrock**, **Amazon DynamoDB**, and **Amazon S3**.

---

## Technical Specifications
- **Python Version:** Python 3.12 (AWS Lambda Runtime `python3.12`)
- **AWS SDK:** `boto3` / `botocore`
- **Response Format:** Standard API Gateway proxy JSON response (`statusCode`, `headers`, `body`)
- **Error Handling:** Centralized exception logging with sanitized public error messages

---

## Directory Architecture

```text
Backend/
├── .env.example                     # Environment variables configuration template
├── README.md                        # Backend documentation & guidelines
├── requirements.txt                 # Core Python dependencies (boto3)
├── functions/                       # AWS Lambda Microservices Handlers
│   ├── service-request/
│   │   └── handler.py               # Request intake & Bedrock AI decision support handler
│   ├── service-job/
│   │   └── handler.py               # Job lifecycle & technician assignment handler
│   ├── technician/
│   │   └── handler.py               # Technician skill matrix & dispatch handler
│   └── report/
│       └── handler.py               # Bedrock service report generation handler
└── shared/                          # Shared Python Helper Modules
    ├── __init__.py
    ├── config.py                    # Environment configuration parser
    └── response.py                  # API Gateway JSON response & error formatting
```

---

## Environment Configuration
The backend relies on environment variables injected via AWS Lambda execution settings or `.env` during local testing.

Key Configuration Keys:
- `AWS_REGION`: Target AWS deployment region (Default: `ap-south-1`)
- `BEDROCK_MODEL_ID`: Amazon Bedrock model string (Default: `anthropic.claude-3-5-sonnet-20241022-v2:0`)
- `DYNAMODB_TABLE_NAME`: Target single-table NoSQL datastore (Default: `ServiceForge_CoreTable`)
- `S3_BUCKET_NAME`: Target S3 bucket for photos and PDF reports
- `LOG_LEVEL`: Logging verbosity level (Default: `INFO`)

> **Security Rule:** Never commit AWS access keys or secret credentials to source control. AWS Lambda execution utilizes IAM Roles with least-privilege policies.

---

## Local Development Expectations
When testing handlers locally or using a local test runner:
1. Ensure Python 3.11+ is installed.
2. Install dependencies: `pip install -r Backend/requirements.txt`.
3. Invoke handlers directly passing mock API Gateway proxy events.
