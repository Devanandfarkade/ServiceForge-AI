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
| **Amazon Bedrock** | Core AI reasoning, unstructured entity extraction, safety checklist generation, missing info detection, and customer-facing report generation | Models: Claude 3.5 Sonnet (for complex technical extraction & report writing) / Claude 3 Haiku (for fast triage); Structured JSON output mode. |
| **AWS Lambda** | Event-driven microservices compute executing request processing, AI orchestrations, job state transitions, and presigned URL generation | Node.js 20.x runtime, IAM least-privilege roles, warm start provisioned concurrency for critical API paths. |
| **Amazon API Gateway** | API entry point, route dispatching, request throttling, CORS handling, and JWT authorization verification | REST API type, integrated with Cognito User Pool Authorizer, request validation schemas. |
| **Amazon DynamoDB** | Central single-table NoSQL datastore housing Users, Customers, Assets, Requests, AI Analyses, Jobs, Assignments, Updates, and Reports | Single-Table Design with GSI indexing for $O(1)$ performance, On-Demand Capacity mode, Point-In-Time Recovery (PITR). |
| **Amazon S3** | Object storage for site photos, technician field attachments, equipment PDF manuals, and generated service report documents | Private bucket with AES-256 server-side encryption, CORS rules, and secure short-lived presigned URL access. |
| **Amazon Cognito** | Enterprise User Pool authentication, RBAC claim injection into JWTs, and secure sign-in / password reset flows | Cognito User Pool + Identity Pool, custom claims (`custom:role`, `custom:org_id`), MFA support. |
| **Amazon CloudWatch** | System observability, API log aggregation, Lambda error metrics, and security audit trail logging | Centralized log groups with retention policies, CloudWatch Alarms for 5xx errors and Bedrock throttling. |
| **AWS Amplify / CloudFront** | Global edge distribution, static web hosting, SSL certificate management, and continuous deployment | Global CDN edge caching, custom domain routing, HTTPS enforcement. |

---

## 3. Frontend Architecture & Folder Structure

The frontend is a modular, component-driven Single Page Application (SPA) built with React 18, Vite 6, and Tailwind CSS v4.

```text
src/
├── components/           # Reusable UI Components
│   ├── common/           # Buttons, Badges, Modals, Cards, Input, Table
│   ├── ai/               # AI Analysis Card, Confidence Pill, Safety Warning
│   ├── requests/         # Request Form, Request List, Side-by-Side Review
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
│   ├── api.js            # Axios / Fetch HTTP Client with Auth Interceptor
│   ├── requestService.js # Service Requests endpoints
│   ├── aiService.js      # Bedrock AI analysis endpoints
│   ├── jobService.js      # Service Jobs endpoints
│   └── s3Service.js      # Presigned URL upload helpers
├── hooks/                # Custom React Hooks
│   ├── useAuth.js        # Auth state & user permissions
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

## 4. End-to-End Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Manager
    participant SPA as React Frontend
    participant APIGW as API Gateway
    participant Lambda as Lambda Compute
    participant Bedrock as Amazon Bedrock
    participant DDB as DynamoDB
    participant S3 as Amazon S3

    Customer->>SPA: Submit unstructured service request text
    SPA->>APIGW: POST /api/requests (Bearer JWT)
    APIGW->>Lambda: Invoke RequestProcessing Lambda
    Lambda->>DDB: Save raw ServiceRequest (Status: PENDING_AI)
    Lambda->>Bedrock: Invoke Model (Prompt + Raw Request Text)
    Bedrock-->>Lambda: Return Structured JSON (Symptoms, Tools, Parts, Safety)
    Lambda->>DDB: Save AIAnalysis entity & update ServiceRequest (Status: PENDING_REVIEW)
    Lambda-->>SPA: Return Request & AI Analysis payload
    SPA-->>Customer: Display side-by-side Review & Decision Support screen
```

---

## 5. Implementation Phases & Roadmap

```mermaid
gantt
    title ServiceForge AI Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    React + Vite + Tailwind Setup       :done, p1, 2026-09-22, 1d
    section Phase 2: Architecture
    Product & AWS Architecture Specs   :active, p2, 2026-09-22, 1d
    section Phase 3: Frontend UI Shell
    Layout, Navigation & Core Screens  :p3, 2026-09-23, 2d
    section Phase 4: Mock Data & Flows
    Interactive UI & Flow Validation   :p4, 2026-09-25, 2d
    section Phase 5: AWS & Bedrock
    Lambda, Bedrock & DynamoDB Integration :p5, 2026-09-27, 3d
```
