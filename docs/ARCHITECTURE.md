# ServiceForge AI — System Architecture Specification

**Version:** 1.0.0  
**Project:** ServiceForge AI  
**Hackathon:** AWS Builder Center "Zero to Shipped" Hackathon  
**Target Architecture:** Fully Serverless AWS Architecture  

---

## 1. System Architecture Overview

ServiceForge AI leverages a 100% serverless, event-driven, cloud-native architecture built on AWS. The design prioritizes zero idle infrastructure cost, sub-second API latency, enterprise security, and seamless AI orchestrations via Amazon Bedrock.

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (SPA)"]
        SPA["ServiceForge React SPA\n(Vite + Tailwind v4)"]
    end

    subgraph HostingLayer["Edge & CDN Hosting"]
        CF["Amazon CloudFront CDN"]
        S3Hosting["Amazon S3 Static Bucket"]
    end

    subgraph GatewayLayer["API & Security Layer"]
        APIGW["Amazon API Gateway\n(REST API)"]
        Cognito["Amazon Cognito\nUser & Identity Pools"]
    end

    subgraph ComputeLayer["Serverless Compute (AWS Lambda)"]
        AuthFn["Auth & User Lambda"]
        RequestFn["Service Request Lambda"]
        BedrockFn["Bedrock AI Orchestrator Lambda"]
        JobFn["Service Job & Dispatch Lambda"]
        ReportFn["Report Generator Lambda"]
    end

    subgraph AILayer["AI Intelligence Layer"]
        Bedrock["Amazon Bedrock\n(Claude 3.5 Sonnet / Haiku)"]
    end

    subgraph StorageLayer["Data & File Persistence"]
        DDB[("Amazon DynamoDB\n(Single-Table Design)")]
        S3Storage[("Amazon S3 Bucket\n(Attachments & Reports)")]
        CW[("Amazon CloudWatch\n(Logs & Audit Trail)")]
    end

    SPA -->|HTTPS / Static Assets| CF
    CF --> S3Hosting
    SPA -->|REST Calls + JWT| APIGW
    APIGW -->|Verify Token| Cognito
    APIGW --> AuthFn
    APIGW --> RequestFn
    APIGW --> BedrockFn
    APIGW --> JobFn
    APIGW --> ReportFn

    BedrockFn -->|Invoke FM| Bedrock
    ReportFn -->|Invoke FM| Bedrock

    RequestFn --> DDB
    JobFn --> DDB
    AuthFn --> DDB
    BedrockFn --> DDB
    ReportFn --> DDB

    JobFn -->|Presigned URLs| S3Storage
    ReportFn -->|PDF / Storage| S3Storage

    ComputeLayer -->|Logs & Metrics| CW
```

---

## 2. AWS Component Roles & Responsibility Breakdown

| AWS Service | Architecture Responsibility | Key Configuration / Details |
| :--- | :--- | :--- |
| **Amazon Bedrock** | Core AI reasoning, multimodal image/text diagnostic extraction, safety checklist generation, missing info detection, and customer report synthesis | Models: Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`); Multimodal vision support + Structured JSON output. |
| **AWS Lambda** | Event-driven microservices compute executing request processing, AI orchestrations, job state transitions, and presigned URL generation | Python 3.12 runtime, IAM least-privilege roles, warm start concurrency for critical API paths. |
| **Amazon API Gateway** | API entry point, route dispatching, request throttling, CORS handling, and JWT authorization verification | REST API type, integrated with Cognito User Pool Authorizer, request validation schemas. |
| **Amazon DynamoDB** | Central single-table NoSQL datastore housing Users, Customers, Assets, Requests, Attachments, AI Analyses, Jobs, Assignments, Updates, and Reports | Single-Table Design with GSI indexing for $O(1)$ performance, On-Demand Capacity mode, Point-In-Time Recovery (PITR). |
| **Amazon S3** | Object storage for site photos, technician field attachments, equipment PDF manuals, and generated service report documents | Private bucket with AES-256 server-side encryption, CORS rules, and secure short-lived presigned URL access (900s expiration). |
| **Amazon Cognito** | Enterprise User Pool authentication, RBAC claim injection into JWTs, and secure sign-in / password reset flows | Cognito User Pool + Identity Pool, custom claims (`custom:role`, `custom:org_id`), MFA support. |
| **Amazon CloudWatch** | System observability, API log aggregation, Lambda error metrics, and security audit trail logging | Centralized log groups with 30-day retention policies, CloudWatch Alarms for 5xx errors and Bedrock throttling. |
| **AWS Amplify / CloudFront** | Global edge distribution, static web hosting, SSL certificate management, and continuous deployment | Global CDN edge caching, custom domain routing, HTTPS enforcement. |

---

## 3. S3 Presigned Upload Architecture & Sequence

To maintain high performance and prevent unnecessary bandwidth overhead on Lambda compute, binary evidence uploads (photos, audio files, diagnostic PDFs) stream directly from the browser to Amazon S3 using short-lived Presigned URLs:

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser / Mobile App
    participant APIGW as API Gateway
    participant Lambda as Service Request Lambda
    participant S3 as Amazon S3 (Private Bucket)
    participant DDB as DynamoDB (ServiceForge)

    User->>APIGW: POST /attachments/presign (fileName, contentType, sizeBytes)
    APIGW->>Lambda: Validate Auth JWT & Org Boundary
    Note over Lambda: Check size limits (<=15MB) & MIME type whitelist
    Lambda->>S3: Generate Presigned PutObject URL (900s expiration)
    Lambda->>DDB: Save Attachment Metadata (Status: PENDING_UPLOAD)
    Lambda-->>User: Return { attachmentId, uploadUrl, s3ObjectKey }
    
    User->>S3: PUT binary file directly to uploadUrl
    S3-->>User: 200 OK (Uploaded)

    User->>APIGW: POST /service-requests (description, descriptionSource, attachments: [attachmentId])
    APIGW->>Lambda: Create Service Request & Link Attachments
    Lambda->>DDB: Update Attachment entity & ServiceRequest entity
```

### Key Architectural Principles:
1. **Direct S3 Upload:** Large files **NEVER** pass through Lambda memory or API Gateway request payloads.
2. **Private S3 Storage:** S3 buckets remain 100% private (`BlockPublicAccess = true`).
3. **Short-Lived Access:** Upload URLs expire in **900 seconds (15 minutes)**. Download access is gated via short-lived GetObject presigned URLs generated on demand.
4. **Tenant-Isolated S3 Key Structure:** S3 object keys strictly follow tenant organization boundaries: `attachments/orgs/<orgId>/<serviceRequestId>/<attachmentId>/<fileName>`.

---

## 4. Frontend Architecture & Folder Structure

The frontend is a modular, component-driven Single Page Application (SPA) built with React 18, Vite 6, and Tailwind CSS v4.

```text
src/
├── components/           # Reusable UI Components
│   ├── common/           # Buttons, Badges, Modals, Cards, Input, Table
│   ├── ai/               # AI Analysis Card, Confidence Pill, Safety Warning
│   ├── requests/         # Request Form, Voice Recorder, Attachment Uploader, Review Screen
│   ├── jobs/             # Job Card, Status Pipeline, Assignment Drawer
│   ├── technicians/      # Technician Card, Skill Badge, Availability Bar
│   └── reports/          # Service Report Viewer, PDF Export Preview
├── pages/                # View Pages
│   ├── DashboardPage.jsx
│   ├── ServiceRequestsPage.jsx
│   ├── ServiceJobsPage.jsx
│   ├── TechniciansPage.jsx
│   ├── CustomersPage.jsx
│   ├── AssetsPage.jsx
│   ├── ReportsPage.jsx
│   └── SettingsPage.jsx
├── layouts/              # Screen Layout Shells
│   ├── AppLayout.jsx     # Main Enterprise Sidebar & Top Bar Layout
│   └── AuthLayout.jsx    # Authentication Shell
├── services/             # API & Integration Layers
│   ├── api.js            # Fetch HTTP Client with Auth Interceptor
│   ├── requestService.js # Service Requests endpoints
│   ├── aiService.js      # Bedrock AI analysis endpoints
│   ├── jobService.js      # Service Jobs endpoints
│   └── s3Service.js      # Presigned URL upload helpers
├── hooks/                # Custom React Hooks
│   ├── useAuth.js        # Auth state & user permissions
│   ├── useVoiceRecorder.js # Voice recording state machine & STT handler
│   ├── useRequests.js    # Request query & mutation hook
│   └── useJobs.js        # Job management hook
├── lib/                  # Utilities & Helpers
│   ├── constants.js      # Enums, status codes, priority colors
│   ├── formatters.js     # Date, currency, string formatters
│   └── validators.js     # Input validation schema
├── assets/               # Branding, SVG icons, static images
├── App.jsx               # Application Router & Global Context Providers
├── main.jsx              # React Entry Point
└── index.css             # Tailwind CSS v4 Global Base Styles
```

---

## 5. End-to-End Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Manager
    participant SPA as React Frontend
    participant APIGW as API Gateway
    participant Lambda as Lambda Compute
    participant Bedrock as Amazon Bedrock (Claude 3.5 Sonnet)
    participant DDB as DynamoDB
    participant S3 as Amazon S3

    Customer->>SPA: Record voice / type text & attach evidence
    SPA->>APIGW: POST /attachments/presign
    APIGW->>Lambda: Generate S3 Presigned Upload URL
    Lambda-->>SPA: Return presigned upload URL
    SPA->>S3: Upload evidence images/docs directly to S3
    SPA->>APIGW: POST /service-requests (description, descriptionSource, attachments)
    APIGW->>Lambda: Invoke RequestProcessing Lambda
    Lambda->>DDB: Save ServiceRequest & Attachment metadata
    Lambda->>Bedrock: Invoke Model (Description Text + Attached Images/Docs)
    Bedrock-->>Lambda: Return Multimodal AI Analysis (Symptoms, Tools, Parts, Safety)
    Lambda->>DDB: Save AIAnalysis entity & update ServiceRequest (Status: PENDING_REVIEW)
    Lambda-->>SPA: Return Request & AI Analysis payload
    SPA-->>Customer: Display side-by-side Review & Decision Support screen
```

---

## 6. Implementation Phases & Roadmap

```mermaid
gantt
    title ServiceForge AI Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    React + Vite + Tailwind Setup       :done, p1, 2026-09-22, 1d
    section Phase 2: Architecture & Specs
    Product, Multimodal & AWS Specs    :active, p2, 2026-09-22, 1d
    section Phase 3: SAM Infrastructure
    AWS SAM Serverless Template         :done, p3, 2026-09-23, 1d
    section Phase 4: Backend Implementation
    Lambda Microservices & Bedrock      :p4, 2026-09-24, 3d
    section Phase 5: Verification & Testing
    End-to-End Multimodal Validation   :p5, 2026-09-27, 2d
```

