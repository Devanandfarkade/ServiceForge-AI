# ServiceForge AI — Database & Storage Specification

**Version:** 2.0.0  
**Project:** ServiceForge AI  
**Primary Database:** Amazon DynamoDB (Single-Table Design)  
**Table Name:** `ServiceForge`  
**Object Storage:** Amazon S3 (`serviceforge-ai-attachments-{region}`)  
**Multi-Tenancy:** Organization Level Data Isolation via `organizationId` (`ORG#<orgId>`)  

---

## 1. Multi-Tenant Architecture & Partitioning

The `ServiceForge` table uses a Single-Table Design enforcing strict multi-tenancy. Every business record includes an explicit `organizationId` parameter ensuring data boundary isolation across tenants.

### 1.1 Key Schema Structure
- **Partition Key (`PK`):** String (Format: `ORG#<orgId>#<EntityType>#<EntityId>` or `ORG#<orgId>#<ParentEntityId>`)
- **Sort Key (`SK`):** String (Format: `METADATA`, `AI_ANALYSIS`, `UPDATE#<timestamp>`, `REPORT`)

### 1.2 Global Secondary Indexes (GSIs)

#### GSI1: Status & Dispatch Search Index
Query items across organizations by state, assigned technician, or customer.
- **`GSI1PK`:** `ORG#<orgId>#STATUS#<status>` or `ORG#<orgId>#TECH#<technicianId>`
- **`GSI1SK`:** `CREATED#<timestamp>` or `JOB#<jobId>`

#### GSI2: SLA Uptime & Audit Trail Index
Query priority alerts, SLA deadlines, and administrative audit logs.
- **`GSI2PK`:** `ORG#<orgId>#PRIORITY#<priority>` or `ORG#<orgId>#AUDIT`
- **`GSI2SK`:** `DEADLINE#<timestamp>` or `TIMESTAMP#<timestamp>`

---

## 2. Entity Specifications

### 2.1 Entity 1: `Organization`
- **PK:** `ORG#<orgId>`
- **SK:** `METADATA`
- **GSI1PK:** `STATUS#ACTIVE` | **GSI1SK:** `ORG#<orgId>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `name` (String)
- `tier` (String: `ENTERPRISE` | `PROFESSIONAL`)
- `createdAt` (String, ISO8601)

---

### 2.2 Entity 2: `User`
- **PK:** `ORG#<orgId>`
- **SK:** `USER#<userId>`
- **GSI1PK:** `ORG#<orgId>#ROLE#<role>` | **GSI1SK:** `USER#<userId>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `userId` (String, UUID)
- `email` (String)
- `fullName` (String)
- `role` (String: `ADMIN` | `SERVICE_MANAGER` | `DISPATCHER` | `TECHNICIAN` | `CUSTOMER`)
- `customerId` (String, UUID, Optional)
- `status` (String: `ACTIVE` | `SUSPENDED`)
- `createdAt` (String, ISO8601)

#### Example Record JSON:
```json
{
  "PK": "ORG#org-8841-alpha",
  "SK": "USER#u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "GSI1PK": "ORG#org-8841-alpha#ROLE#SERVICE_MANAGER",
  "GSI1SK": "USER#u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "organizationId": "org-8841-alpha",
  "userId": "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "email": "manager@apexmfg.com",
  "fullName": "Marcus Smith",
  "role": "SERVICE_MANAGER",
  "status": "ACTIVE",
  "createdAt": "2026-09-22T08:35:00Z"
}
```

---

### 2.3 Entity 3: `Customer`
- **PK:** `ORG#<orgId>`
- **SK:** `CUST#<customerId>`
- **GSI1PK:** `ORG#<orgId>#CUSTOMERS` | **GSI1SK:** `CUST#<customerId>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `customerId` (String, UUID)
- `companyName` (String)
- `contactEmail` (String)
- `slaTier` (String: `PLATINUM_4H` | `GOLD_8H` | `SILVER_24H` | `STANDARD`)
- `createdAt` (String, ISO8601)

---

### 2.4 Entity 4: `Asset` (Equipment)
- **PK:** `ORG#<orgId>`
- **SK:** `ASSET#<assetId>`
- **GSI1PK:** `ORG#<orgId>#CUST#<customerId>` | **GSI1SK:** `ASSET#<assetId>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `assetId` (String, UUID)
- `customerId` (String, UUID)
- `name` (String)
- `modelNumber` (String)
- `serialNumber` (String)
- `category` (String: `COMPRESSOR` | `HVAC` | `GENERATOR` | `PUMP`)
- `status` (String: `OPERATIONAL` | `DEGRADED` | `OFFLINE`)
- `createdAt` (String, ISO8601)

---

### 2.5 Entity 5: `ServiceRequest`
- **PK:** `ORG#<orgId>`
- **SK:** `REQ#<requestId>`
- **GSI1PK:** `ORG#<orgId>#STATUS#<status>` | **GSI1SK:** `CREATED#<timestamp>`
- **GSI2PK:** `ORG#<orgId>#PRIORITY#<priority>` | **GSI2SK:** `CREATED#<timestamp>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `requestId` (String, UUID)
- `ticketNumber` (String: `REQ-2026-0841`)
- `customerId` (String, UUID)
- `assetId` (String, UUID, Optional)
- `submittedByUserId` (String, UUID)
- `description` (String: Final user-reviewed text description)
- `descriptionSource` (String: `typed` | `voice` | `edited_voice`)
- `attachments` (List of Strings: `attachmentId` UUIDs)
- `status` (String: `SUBMITTED` | `AI_ANALYZING` | `PENDING_REVIEW` | `APPROVED` | `REJECTED`)
- `priority` (String: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`)
- `createdAt` (String, ISO8601)
- `updatedAt` (String, ISO8601)

#### Example Record JSON:
```json
{
  "PK": "ORG#org-8841-alpha",
  "SK": "REQ#r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "GSI1PK": "ORG#org-8841-alpha#STATUS#PENDING_REVIEW",
  "GSI1SK": "CREATED#2026-09-22T10:15:00Z",
  "GSI2PK": "ORG#org-8841-alpha#PRIORITY#HIGH",
  "GSI2SK": "CREATED#2026-09-22T10:15:00Z",
  "organizationId": "org-8841-alpha",
  "requestId": "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "ticketNumber": "REQ-2026-0841",
  "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
  "assetId": "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
  "submittedByUserId": "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "description": "Our industrial compressor starts normally but becomes very noisy and shuts down after about ten minutes.",
  "descriptionSource": "edited_voice",
  "attachments": ["att-9988-a1b2", "att-9988-c3d4"],
  "status": "PENDING_REVIEW",
  "priority": "HIGH",
  "createdAt": "2026-09-22T10:15:00Z",
  "updatedAt": "2026-09-22T10:15:05Z"
}
```

---

### 2.6 Entity 6: `AIAnalysis`
Stores Amazon Bedrock decision support output.

- **PK:** `ORG#<orgId>`
- **SK:** `AI_ANALYSIS#<requestId>`
- **GSI1PK:** `ORG#<orgId>#AI_STATUS#<reviewStatus>` | **GSI1SK:** `CREATED#<timestamp>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `analysisId` (String, UUID)
- `requestId` (String, UUID)
- `bedrockModelId` (String: `anthropic.claude-3-5-sonnet-20241022-v2:0`)
- `promptVersion` (String: `v1.2`)
- `summary` (String)
- `detectedAssetCategory` (String)
- `symptoms` (List of Strings)
- `recommendedPriority` (String)
- `recommendedSkillProfile` (String)
- `suggestedInspectionSteps` (List of Maps: `stepNumber`, `instruction`, `critical`)
- `suggestedTools` (List of Strings)
- `suggestedParts` (List of Maps: `partName`, `partNumber`)
- `safetyConsiderations` (List of Strings)
- `missingInformation` (List of Strings)
- `confidenceScore` (Number: `0.94`)
- `reviewStatus` (String: `PENDING_REVIEW` | `APPROVED_BY_MANAGER` | `REJECTED`)
- `createdAt` (String, ISO8601)

---

### 2.7 Entity 7: `ServiceJob`
- **PK:** `ORG#<orgId>`
- **SK:** `JOB#<jobId>`
- **GSI1PK:** `ORG#<orgId>#JOB_STATUS#<status>` | **GSI1SK:** `SLA#<targetSlaDeadline>`
- **GSI2PK:** `ORG#<orgId>#TECH#<assignedTechnicianId>` | **GSI2SK:** `CREATED#<timestamp>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `jobId` (String, UUID)
- `jobIdNumber` (String: `JOB-2026-0412`)
- `requestId` (String, UUID)
- `customerId` (String, UUID)
- `assetId` (String, UUID)
- `title` (String)
- `priority` (String)
- `status` (String: `UNASSIGNED` | `ASSIGNED` | `EN_ROUTE` | `IN_PROGRESS` | `COMPLETED`)
- `assignedTechnicianId` (String, UUID, Optional)
- `targetSlaDeadline` (String, ISO8601)
- `createdAt` (String, ISO8601)

---

### 2.8 Entity 8: `JobAssignment`
- **PK:** `ORG#<orgId>`
- **SK:** `ASSIGN#<jobId>#<technicianId>`
- **GSI1PK:** `ORG#<orgId>#TECH#<technicianId>` | **GSI1SK:** `ASSIGNED#<timestamp>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `jobId` (String, UUID)
- `technicianId` (String, UUID)
- `assignedByUserId` (String, UUID)
- `scheduledStartTime` (String, ISO8601)
- `status` (String: `PENDING` | `ACCEPTED` | `REJECTED`)
- `assignedAt` (String, ISO8601)

---

### 2.9 Entity 9: `JobUpdate`
- **PK:** `ORG#<orgId>`
- **SK:** `UPDATE#<jobId>#<timestamp>`
- **GSI1PK:** `ORG#<orgId>#JOB_UPDATES` | **GSI1SK:** `JOB#<jobId>#<timestamp>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `updateId` (String, UUID)
- `jobId` (String, UUID)
- `technicianId` (String, UUID)
- `updateType` (String: `CHECKLIST_STEP` | `NOTE` | `PART_USED` | `PHOTO_LOG`)
- `stepNumberCompleted` (Number, Optional)
- `notes` (String)
- `partsUsed` (List of Maps)
- `timestamp` (String, ISO8601)

---

### 2.10 Entity 10: `ServiceReport`
- **PK:** `ORG#<orgId>`
- **SK:** `REPORT#<jobId>`
- **GSI1PK:** `ORG#<orgId>#REPORTS` | **GSI1SK:** `REPORT#<reportId>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `reportId` (String, UUID)
- `jobId` (String, UUID)
- `reportNumber` (String: `RPT-2026-0412`)
- `executiveSummary` (String)
- `workPerformed` (String)
- `partsReplaced` (List of Maps)
- `pdfS3Key` (String)
- `generatedAt` (String, ISO8601)

---

### 2.11 Entity 11: `Attachment` Metadata
- **PK:** `ORG#<orgId>`
- **SK:** `ATTACHMENT#<entityId>#<attachmentId>`
- **GSI1PK:** `ORG#<orgId>#S3KEY#<s3ObjectKey>` | **GSI1SK:** `METADATA`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `attachmentId` (String, UUID)
- `entityType` (String: `SERVICE_REQUEST` | `JOB_UPDATE` | `SERVICE_REPORT`)
- `entityId` (String, UUID)
- `fileName` (String)
- `contentType` (String)
- `s3Bucket` (String)
- `s3ObjectKey` (String)
- `uploadedAt` (String, ISO8601)

---

### 2.12 Entity 12: `AuditLog`
- **PK:** `ORG#<orgId>`
- **SK:** `AUDIT#<timestamp>#<logId>`
- **GSI2PK:** `ORG#<orgId>#AUDIT` | **GSI2SK:** `TIMESTAMP#<timestamp>`

#### Attributes & Data Types:
- `organizationId` (String, UUID)
- `logId` (String, UUID)
- `userId` (String, UUID)
- `userRole` (String)
- `action` (String: `CREATE_REQUEST` | `APPROVE_AI_JOB` | `ASSIGN_TECH` | `CLOSE_JOB`)
- `resourceId` (String)
- `ipAddress` (String)
- `timestamp` (String, ISO8601)

---

## 3. Query Access Patterns & Expressions

| Access Pattern | Target Table / Index | Key Condition Expression |
| :--- | :--- | :--- |
| **Get Customer** | Base Table | `PK = ORG#<orgId>` AND `SK = CUST#<customerId>` |
| **List Customer Assets** | GSI1 | `GSI1PK = ORG#<orgId>#CUST#<customerId>` AND `begins_with(GSI1SK, ASSET#)` |
| **List Requests by Status** | GSI1 | `GSI1PK = ORG#<orgId>#STATUS#<status>` |
| **List High-Priority Requests** | GSI2 | `GSI2PK = ORG#<orgId>#PRIORITY#HIGH` |
| **Get Service Job** | Base Table | `PK = ORG#<orgId>` AND `SK = JOB#<jobId>` |
| **List Jobs for Technician** | GSI2 | `GSI2PK = ORG#<orgId>#TECH#<technicianId>` |
| **Get Job Updates Timeline** | Base Table | `PK = ORG#<orgId>` AND `begins_with(SK, UPDATE#<jobId>)` |
| **Get AI Analysis** | Base Table | `PK = ORG#<orgId>` AND `SK = AI_ANALYSIS#<requestId>` |
| **Get Service Report** | Base Table | `PK = ORG#<orgId>` AND `SK = REPORT#<jobId>` |
| **List Organization Audit Logs**| GSI2 | `GSI2PK = ORG#<orgId>#AUDIT` |
