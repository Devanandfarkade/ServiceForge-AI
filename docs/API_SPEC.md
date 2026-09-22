# ServiceForge AI — REST API Specification

**Version:** 1.0.0  
**Project:** ServiceForge AI  
**Protocol:** HTTPS / REST  
**Base URL:** `https://api.serviceforge.ai/v1`  
**Authentication:** Amazon Cognito JWT (`Authorization: Bearer <token>`)  
**Data Isolation:** Enforced via `custom:org_id` JWT claim  

---

## 1. Standard API Response & Error Format

All API responses return a consistent JSON envelope:

### 1.1 Success Response Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "status_code": 200,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-09-22T10:15:00Z",
    "request_id": "req-9988-a1b2-c3d4"
  }
}
```

### 1.2 Error Response Envelope (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "status_code": 400,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Required field 'rawDescription' cannot be empty.",
    "details": [
      { "field": "rawDescription", "issue": "Minimum length is 10 characters." }
    ]
  },
  "meta": {
    "timestamp": "2026-09-22T10:15:00Z",
    "request_id": "req-9988-a1b2-c3d4"
  }
}
```

---

## 2. API Endpoints Specification

### 2.1 Authentication & User Context
#### `GET /auth/me`
- **Description:** Retrieve current authenticated user profile and organizational context.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Response Data:**
```json
{
  "userId": "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "email": "manager@apexmfg.com",
  "fullName": "Marcus Smith",
  "role": "SERVICE_MANAGER",
  "organizationId": "org-8841-alpha"
}
```

---

### 2.2 Customers API
#### `GET /customers`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`
- **Query Parameters:** `limit` (Int), `nextToken` (String)
- **Response Data:** Array of `Customer` objects.

#### `GET /customers/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`
- **Response Data:** `Customer` object.

---

### 2.3 Assets (Equipment) API
#### `GET /assets`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Query Parameters:** `customerId` (String, Optional)
- **Response Data:** Array of `Asset` objects.

#### `GET /assets/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Response Data:** `Asset` object.

---

### 2.4 Service Requests API
#### `POST /service-requests`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `CUSTOMER`
- **Request Body:**
```json
{
  "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
  "assetId": "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
  "rawDescription": "Our industrial compressor starts normally but becomes very noisy and shuts down after about ten minutes.",
  "channel": "WEB_PORTAL"
}
```
- **Response Data (HTTP 201):** `ServiceRequest` object with `status: "SUBMITTED"`.

#### `GET /service-requests`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `CUSTOMER`
- **Query Parameters:** `status` (String, Optional), `priority` (String, Optional)
- **Response Data:** Array of `ServiceRequest` objects.

#### `GET /service-requests/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `CUSTOMER`
- **Response Data:** `ServiceRequest` object.

#### `PATCH /service-requests/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`
- **Request Body:** `{ "status": "APPROVED" | "REJECTED", "priority": "HIGH" }`
- **Response Data:** Updated `ServiceRequest` object.

---

### 2.5 AI Analysis API
#### `POST /service-requests/{id}/analyze`
- **Description:** Triggers Amazon Bedrock (Claude 3.5 Sonnet) entity extraction and decision support generation.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`
- **Response Data (HTTP 200):** `AIAnalysis` object.

#### `GET /service-requests/{id}/analysis`
- **Description:** Retrieves previously stored `AIAnalysis` record.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `CUSTOMER`
- **Response Data:** `AIAnalysis` object.

---

### 2.6 Service Jobs API
#### `POST /service-jobs`
- **Description:** Creates an executable `ServiceJob` from an approved `ServiceRequest`.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`
- **Request Body:**
```json
{
  "requestId": "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "title": "AC-4500 Compressor Noise & Thermal Shutdown Inspection",
  "priority": "HIGH",
  "confirmedChecklist": [
    { "stepNumber": 1, "instruction": "Perform LOTO electrical lockout procedure." }
  ],
  "requiredTools": ["Multimeter", "Thermal Imager"],
  "targetSlaDeadline": "2026-09-22T14:15:00Z"
}
```
- **Response Data (HTTP 201):** `ServiceJob` object (`status: "UNASSIGNED"`).

#### `GET /service-jobs`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`
- **Query Parameters:** `status` (String, Optional), `assignedTechnicianId` (String, Optional)
- **Response Data:** Array of `ServiceJob` objects.

#### `GET /service-jobs/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Response Data:** `ServiceJob` object.

#### `PATCH /service-jobs/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`
- **Request Body:** `{ "status": "IN_PROGRESS" | "EN_ROUTE" }`
- **Response Data:** Updated `ServiceJob` object.

---

### 2.7 Technicians API
#### `GET /technicians`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`
- **Response Data:** Array of `Technician` objects.

#### `GET /technicians/{id}`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`
- **Response Data:** `Technician` object.

---

### 2.8 Assignments API
#### `POST /service-jobs/{id}/assign`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`
- **Request Body:** `{ "technicianId": "t3u2v1-9988", "scheduledStartTime": "2026-09-22T11:00:00Z" }`
- **Response Data:** `JobAssignment` object (`ServiceJob.status` transitions to `"ASSIGNED"`).

---

### 2.9 Job Updates API
#### `POST /service-jobs/{id}/updates`
- **Description:** Allows technician to log real-time field progress, completed checklist items, and notes.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `TECHNICIAN`
- **Request Body:**
```json
{
  "updateType": "CHECKLIST_STEP",
  "stepNumberCompleted": 1,
  "notes": "LOTO verification complete. Voltage zero confirmed."
}
```
- **Response Data (HTTP 201):** `JobUpdate` object.

#### `GET /service-jobs/{id}/updates`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Response Data:** Array of `JobUpdate` timeline records.

---

### 2.10 Job Completion & Service Reports API
#### `POST /service-jobs/{id}/complete`
- **Description:** Marks job as completed by technician.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `TECHNICIAN`
- **Response Data:** Updated `ServiceJob` object (`status: "COMPLETED"`).

#### `POST /service-jobs/{id}/report/generate`
- **Description:** Invokes Amazon Bedrock to synthesize field logs into an executive Service Completion Report.
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`
- **Response Data (HTTP 201):** `ServiceReport` object.

#### `GET /service-jobs/{id}/report`
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Response Data:** `ServiceReport` object containing S3 PDF download URL.

---

### 2.11 Attachments API
#### `POST /attachments/presign`
- **Description:** Generates a secure, 15-minute S3 presigned URL for binary file uploads (photos, audio, signatures).
- **Authorization:** `ADMIN`, `SERVICE_MANAGER`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`
- **Request Body:**
```json
{
  "entityType": "SERVICE_REQUEST",
  "entityId": "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "fileName": "compressor_audio.m4a",
  "contentType": "audio/m4a"
}
```
- **Response Data (HTTP 200):**
```json
{
  "uploadUrl": "https://serviceforge-ai-attachments.s3.ap-south-1.amazonaws.com/attachments/requests/r1d2e3f4/compressor_audio.m4a?AWSAccessKeyId=...",
  "s3ObjectKey": "attachments/requests/r1d2e3f4/compressor_audio.m4a",
  "expiresInSeconds": 900
}
```

---

## 3. HTTP Status Codes & Error Code Summary

| HTTP Code | Error Code | Description |
| :--- | :--- | :--- |
| `200 OK` | N/A | Successful GET / PATCH request |
| `201 Created` | N/A | Successful POST creation |
| `400 Bad Request` | `INVALID_INPUT` | Missing mandatory field or validation failure |
| `401 Unauthorized` | `INVALID_TOKEN` | Missing or expired Cognito JWT |
| `403 Forbidden` | `ACCESS_DENIED` | Role lacks permission or cross-org access attempt |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Target ID does not exist in tenant organization |
| `409 Conflict` | `INVALID_STATE_TRANSITION` | e.g. Attempting to assign an already completed job |
| `429 Too Many Requests` | `THROTTLED` | API Gateway rate limit exceeded |
| `500 Internal Error` | `INTERNAL_ERROR` | Server-side exception (sanitized public output) |
