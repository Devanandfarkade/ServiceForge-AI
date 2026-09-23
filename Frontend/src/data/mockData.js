/**
 * ServiceForge AI — Centralized Mock Data Layer
 * Strictly aligns with docs/DATA_MODEL.md, docs/DATABASE_SPEC.md, and docs/API_SPEC.md
 */

export const currentOrganization = {
  organizationId: "org-8841-alpha",
  name: "Apex Global Manufacturing",
  tier: "ENTERPRISE",
  createdAt: "2026-01-15T00:00:00Z"
};

export const currentUser = {
  userId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  organizationId: "org-8841-alpha",
  email: "marcus.smith@apexmfg.com",
  fullName: "Marcus Smith",
  role: "SERVICE_MANAGER",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  phone: "+1 (555) 019-2834"
};

export const mockCustomers = [
  {
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    organizationId: "org-8841-alpha",
    companyName: "Industrial Plastics Corp",
    industry: "Chemical & Polymer Manufacturing",
    contactName: "Robert Vance",
    contactEmail: "r.vance@indplastics.com",
    contactPhone: "+1 (555) 234-5678",
    address: { street: "104 Industrial Parkway", city: "Chicago", state: "IL", zip: "60601", country: "USA" },
    slaTier: "PLATINUM_4H",
    status: "ACTIVE",
    activeJobsCount: 2,
    totalAssetsCount: 6,
    createdAt: "2026-02-10T09:00:00Z"
  },
  {
    customerId: "c9d8e7f6-5a4b-3c2d-1e0f-9a8b7c6d5e4f",
    organizationId: "org-8841-alpha",
    companyName: "Vanguard Logistics Hub",
    industry: "Warehousing & Supply Chain",
    contactName: "Elena Rostova",
    contactEmail: "e.rostova@vanguardlog.com",
    contactPhone: "+1 (555) 876-5432",
    address: { street: "450 Airport Freight Rd", city: "Dallas", state: "TX", zip: "75201", country: "USA" },
    slaTier: "GOLD_8H",
    status: "ACTIVE",
    activeJobsCount: 1,
    totalAssetsCount: 4,
    createdAt: "2026-03-01T11:30:00Z"
  },
  {
    customerId: "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    organizationId: "org-8841-alpha",
    companyName: "Titan Energy Systems",
    industry: "Power Generation & Utilities",
    contactName: "James Thornton",
    contactEmail: "j.thornton@titanenergy.com",
    contactPhone: "+1 (555) 345-6789",
    address: { street: "88 Energy Way", city: "Houston", state: "TX", zip: "77001", country: "USA" },
    slaTier: "PLATINUM_4H",
    status: "ACTIVE",
    activeJobsCount: 1,
    totalAssetsCount: 9,
    createdAt: "2026-01-20T14:15:00Z"
  }
];

export const mockAssets = [
  {
    assetId: "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
    organizationId: "org-8841-alpha",
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    customerName: "Industrial Plastics Corp",
    name: "Industrial Air Compressor AC-4500",
    modelNumber: "AC-4500-X",
    serialNumber: "SN-2024-88412",
    category: "COMPRESSOR",
    location: "Plant 2, Compressor Room B, Bay 4",
    installDate: "2024-03-15",
    status: "OPERATIONAL",
    lastServiceDate: "2026-08-12T00:00:00Z",
    openJobsCount: 1
  },
  {
    assetId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    organizationId: "org-8841-alpha",
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    customerName: "Industrial Plastics Corp",
    name: "Chiller Unit Modular Chill-90",
    modelNumber: "CU-900-SPEC",
    serialNumber: "SN-2023-44109",
    category: "HVAC",
    location: "Roof Deck Sector 3",
    installDate: "2023-11-01",
    status: "DEGRADED",
    lastServiceDate: "2026-07-05T00:00:00Z",
    openJobsCount: 1
  },
  {
    assetId: "a3c4e5g6-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    organizationId: "org-8841-alpha",
    customerId: "c9d8e7f6-5a4b-3c2d-1e0f-9a8b7c6d5e4f",
    customerName: "Vanguard Logistics Hub",
    name: "High-Capacity Conveyor Drive System",
    modelNumber: "CDS-880",
    serialNumber: "SN-2025-11029",
    category: "CONVEYOR",
    location: "Sorting Terminal 1",
    installDate: "2025-01-10",
    status: "OPERATIONAL",
    lastServiceDate: "2026-08-30T00:00:00Z",
    openJobsCount: 0
  },
  {
    assetId: "a8f7e6d5-c4b3-2a1f-0e9d-8c7b6a5f4e3d",
    organizationId: "org-8841-alpha",
    customerId: "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    customerName: "Titan Energy Systems",
    name: "Backup Diesel Generator 500kW",
    modelNumber: "DG-500-CAT",
    serialNumber: "SN-2022-77182",
    category: "GENERATOR",
    location: "Substation 4 Yard",
    installDate: "2022-06-20",
    status: "OFFLINE",
    lastServiceDate: "2026-06-18T00:00:00Z",
    openJobsCount: 1
  }
];

export const mockTechnicians = [
  {
    technicianId: "t3u2v1-9988",
    organizationId: "org-8841-alpha",
    userId: "u8v7w6-1122",
    employeeId: "EMP-9042",
    fullName: "David Miller",
    email: "d.miller@serviceforge.ai",
    phone: "+1 (555) 901-2345",
    role: "Senior Field Specialist",
    skills: ["PNEUMATICS_L3", "LOTO_CERTIFIED", "HVAC_SENIOR", "COMPRESSOR_SPECIALIST"],
    currentStatus: "AVAILABLE",
    currentLocation: { latitude: 41.8781, longitude: -87.6298, city: "Chicago, IL" },
    activeJobCount: 1,
    completedJobsCount: 142,
    rating: 4.9,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    technicianId: "t4v5w6-7711",
    organizationId: "org-8841-alpha",
    userId: "u7w6v5-3344",
    employeeId: "EMP-9088",
    fullName: "Sarah Jenkins",
    email: "s.jenkins@serviceforge.ai",
    phone: "+1 (555) 890-1234",
    role: "HVAC & Electrical Master",
    skills: ["HIGH_VOLTAGE_CERTIFIED", "LOTO_CERTIFIED", "HVAC_SENIOR", "CHILLER_MASTER"],
    currentStatus: "ON_JOB",
    currentLocation: { latitude: 32.7767, longitude: -96.7970, city: "Dallas, TX" },
    activeJobCount: 2,
    completedJobsCount: 189,
    rating: 4.95,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    technicianId: "t5w6x7-4422",
    organizationId: "org-8841-alpha",
    userId: "u6x5w4-5566",
    employeeId: "EMP-9112",
    fullName: "Marcus Vance",
    email: "m.vance@serviceforge.ai",
    phone: "+1 (555) 789-0123",
    role: "Mechanical & Robotics Specialist",
    skills: ["CONVEYOR_SPECIALIST", "HYDRAULICS_L2", "LOTO_CERTIFIED"],
    currentStatus: "AVAILABLE",
    currentLocation: { latitude: 29.7604, longitude: -95.3698, city: "Houston, TX" },
    activeJobCount: 0,
    completedJobsCount: 98,
    rating: 4.8,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  }
];

export const mockAIAnalyses = {
  "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f": {
    analysisId: "ai-77482-b91c",
    requestId: "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    bedrockModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    promptVersion: "v1.2",
    executionLatencyMs: 1420,
    summary: "Compressor startup normal with thermal shutdown occurring under load after ~10 minutes accompanied by heavy operational noise.",
    detectedAssetCategory: "COMPRESSOR",
    symptoms: [
      "Heavy operational noise during thermal rise",
      "Automatic thermal/pressure cutout shutdown after ~10 minutes",
      "Normal electrical startup baseline"
    ],
    recommendedPriority: "HIGH",
    recommendedSkillProfile: "Senior HVAC / Pneumatics L3 Certified Technician",
    suggestedInspectionSteps: [
      { stepNumber: 1, instruction: "Perform Lockout/Tagout (LOTO) electrical lockout procedure on breaker Panel B-4.", critical: true },
      { stepNumber: 2, instruction: "Inspect cooling fan shroud, belt tension, and shaft bearing alignment.", critical: false },
      { stepNumber: 3, instruction: "Test thermal overload relay wiring and measure operating resistance.", critical: true },
      { stepNumber: 4, instruction: "Check compressor oil level and sample for metallic friction debris.", critical: false }
    ],
    suggestedTools: [
      "Digital Multimeter (CAT IV)",
      "FLIR Thermal Imaging Camera",
      "Vibration Analyzer",
      "Belt Tension Gauge"
    ],
    suggestedParts: [
      { partName: "Thermal Overload Relay 45A", partNumber: "TR-4500", optional: false },
      { partName: "Heavy Duty Drive Belt", partNumber: "DB-4500", optional: true },
      { partName: "ISO 68 Compressor Lubricant (5L)", partNumber: "OIL-ISO68", optional: true }
    ],
    safetyConsiderations: [
      "Mandatory High-Voltage LOTO verification before opening enclosure.",
      "Thermal burn hazard on compressor cylinder head (operates > 85°C).",
      "Pressurized pneumatic vessel hazard — verify pressure release valve before disassembly."
    ],
    missingInformation: [
      "Digital control panel error code log (e.g. Code E-402 thermal trip) was not provided by requester."
    ],
    confidenceScore: 0.94,
    reviewStatus: "APPROVED_BY_MANAGER",
    createdAt: "2026-09-22T10:15:05Z"
  },
  "r2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f7a": {
    analysisId: "ai-88194-c02d",
    requestId: "r2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
    bedrockModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    promptVersion: "v1.2",
    executionLatencyMs: 1180,
    summary: "Chiller loop temperature spiking above 18°C setpoint during peak facility hours with low refrigerant pressure alert.",
    detectedAssetCategory: "HVAC",
    symptoms: [
      "Secondary cooling loop temperature excursion",
      "Low suction pressure alarm logged",
      "Condenser fan cycling irregularly"
    ],
    recommendedPriority: "CRITICAL",
    recommendedSkillProfile: "Master Chiller & Refrigeration Specialist",
    suggestedInspectionSteps: [
      { stepNumber: 1, instruction: "Verify refrigerant charge level and test for micro-leaks along suction line.", critical: true },
      { stepNumber: 2, instruction: "Check condenser coil cleanliness and clear airflow obstructions.", critical: false },
      { stepNumber: 3, instruction: "Inspect expansion valve actuator signal.", critical: true }
    ],
    suggestedTools: ["Refrigerant Gauge Manifold R-410A", "Electronic Leak Detector", "Anemometer"],
    suggestedParts: [
      { partName: "Thermostatic Expansion Valve", partNumber: "TXV-900", optional: false }
    ],
    safetyConsiderations: ["Refrigerant pressure discharge hazard", "Rotating fan blade hazard"],
    missingInformation: ["Ambient roof deck temperature during peak outage"],
    confidenceScore: 0.91,
    reviewStatus: "PENDING_REVIEW",
    createdAt: "2026-09-22T11:00:05Z"
  }
};

export const mockServiceRequests = [
  {
    requestId: "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    ticketNumber: "REQ-2026-0841",
    organizationId: "org-8841-alpha",
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    customerName: "Industrial Plastics Corp",
    assetId: "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
    assetName: "Industrial Air Compressor AC-4500",
    submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    rawDescription: "Our industrial compressor starts normally but becomes very noisy and shuts down after about ten minutes.",
    channel: "WEB_PORTAL",
    status: "AI Ready",
    priority: "HIGH",
    assignedTechnicianId: "t3u2v1-9988",
    assignedTechnicianName: "David Miller",
    hasAiAnalysis: true,
    createdAt: "2026-09-22T10:15:00Z",
    updatedAt: "2026-09-22T10:15:05Z"
  },
  {
    requestId: "r2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
    ticketNumber: "REQ-2026-0842",
    organizationId: "org-8841-alpha",
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    customerName: "Industrial Plastics Corp",
    assetId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    assetName: "Chiller Unit Modular Chill-90",
    submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    rawDescription: "Chiller unit temperature spiking above 18°C setpoint during peak facility hours with low suction pressure warning.",
    channel: "WEB_PORTAL",
    status: "New",
    priority: "CRITICAL",
    assignedTechnicianId: null,
    assignedTechnicianName: "Unassigned",
    hasAiAnalysis: true,
    createdAt: "2026-09-22T11:00:00Z",
    updatedAt: "2026-09-22T11:00:05Z"
  },
  {
    requestId: "r3f4a5b6-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
    ticketNumber: "REQ-2026-0843",
    organizationId: "org-8841-alpha",
    customerId: "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    customerName: "Titan Energy Systems",
    assetId: "a8f7e6d5-c4b3-2a1f-0e9d-8c7b6a5f4e3d",
    assetName: "Backup Diesel Generator 500kW",
    submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    rawDescription: "Generator fail-to-start alarm triggered during weekly automated transfer switch self-test.",
    channel: "EMAIL",
    status: "In Progress",
    priority: "HIGH",
    assignedTechnicianId: "t4v5w6-7711",
    assignedTechnicianName: "Sarah Jenkins",
    hasAiAnalysis: true,
    createdAt: "2026-09-21T15:30:00Z",
    updatedAt: "2026-09-22T09:00:00Z"
  },
  {
    requestId: "r4g5h6i7-8j9k-0l1m-2n3o-4p5q6r7s8t9u",
    ticketNumber: "REQ-2026-0844",
    organizationId: "org-8841-alpha",
    customerId: "c9d8e7f6-5a4b-3c2d-1e0f-9a8b7c6d5e4f",
    customerName: "Vanguard Logistics Hub",
    assetId: "a3c4e5g6-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    assetName: "High-Capacity Conveyor Drive System",
    submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    rawDescription: "Vibration sensors detecting threshold variance during high-speed sorting operation.",
    channel: "IOT_SENSOR",
    status: "Pending",
    priority: "MEDIUM",
    assignedTechnicianId: "t5w6x7-4422",
    assignedTechnicianName: "Marcus Vance",
    hasAiAnalysis: false,
    createdAt: "2026-09-20T14:10:00Z",
    updatedAt: "2026-09-20T14:10:00Z"
  },
  {
    requestId: "r5h6i7j8-9k0l-1m2n-3o4p-5q6r7s8t9u0v",
    ticketNumber: "REQ-2026-0845",
    organizationId: "org-8841-alpha",
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    customerName: "Industrial Plastics Corp",
    assetId: "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
    assetName: "Hydraulic Stamping Press 2000T",
    submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    rawDescription: "Hydraulic pressure line seal replacement completed and verified under 100% load test.",
    channel: "PHONE_DISPATCH",
    status: "Completed",
    priority: "HIGH",
    assignedTechnicianId: "t3u2v1-9988",
    assignedTechnicianName: "David Miller",
    hasAiAnalysis: true,
    createdAt: "2026-09-18T09:00:00Z",
    updatedAt: "2026-09-19T16:00:00Z"
  },
  {
    requestId: "r6i7j8k9-0l1m-2n3o-4p5q-6r7s8t9u0v1w",
    ticketNumber: "REQ-2026-0846",
    organizationId: "org-8841-alpha",
    customerId: "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    customerName: "Titan Energy Systems",
    assetId: "a8f7e6d5-c4b3-2a1f-0e9d-8c7b6a5f4e3d",
    assetName: "Solar Inverter Array Unit 4",
    submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    rawDescription: "Annual firmware diagnostic update and DC bus capacitor check completed successfully.",
    channel: "WEB_PORTAL",
    status: "Completed",
    priority: "MEDIUM",
    assignedTechnicianId: "t4v5w6-7711",
    assignedTechnicianName: "Sarah Jenkins",
    hasAiAnalysis: true,
    createdAt: "2026-09-17T11:30:00Z",
    updatedAt: "2026-09-18T14:20:00Z"
  }
];

export const mockServiceJobs = [
  {
    jobId: "j9f8e7d6-5c4b-3a2f-1e0d-9c8b7a6f5e4d",
    jobIdNumber: "JOB-2026-0412",
    organizationId: "org-8841-alpha",
    requestId: "r1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    customerId: "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
    customerName: "Industrial Plastics Corp",
    assetId: "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
    assetName: "Industrial Air Compressor AC-4500",
    title: "AC-4500 Compressor Noise & Thermal Shutdown Inspection",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTechnicianId: "t3u2v1-9988",
    assignedTechnicianName: "David Miller",
    targetSlaDeadline: "2026-09-22T16:00:00Z",
    confirmedChecklist: [
      { stepNumber: 1, instruction: "Perform Lockout/Tagout (LOTO) electrical lockout procedure on breaker Panel B-4.", completed: true, completedAt: "2026-09-22T11:45:00Z" },
      { stepNumber: 2, instruction: "Inspect cooling fan shroud, belt tension, and shaft bearing alignment.", completed: true, completedAt: "2026-09-22T12:15:00Z" },
      { stepNumber: 3, instruction: "Test thermal overload relay wiring and measure operating resistance.", completed: false, completedAt: null },
      { stepNumber: 4, instruction: "Check compressor oil level and sample for metallic friction debris.", completed: false, completedAt: null }
    ],
    requiredTools: ["Digital Multimeter (CAT IV)", "FLIR Thermal Imaging Camera", "Vibration Analyzer"],
    requiredParts: [{ partName: "Thermal Overload Relay 45A", partNumber: "TR-4500" }],
    safetyGuidelines: [
      "Mandatory High-Voltage LOTO verification before opening enclosure.",
      "Thermal burn hazard on compressor cylinder head (operates > 85°C)."
    ],
    createdAt: "2026-09-22T10:20:00Z",
    updatedAt: "2026-09-22T12:15:00Z"
  },
  {
    jobId: "j8e7d6c5-4b3a-2f1e-0d9c-8b7a6f5e4d3c",
    jobIdNumber: "JOB-2026-0413",
    organizationId: "org-8841-alpha",
    requestId: "r3f4a5b6-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
    customerId: "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    customerName: "Titan Energy Systems",
    assetId: "a8f7e6d5-c4b3-2a1f-0e9d-8c7b6a5f4e3d",
    assetName: "Backup Diesel Generator 500kW",
    title: "500kW Generator Automated Transfer Failure Diagnostics",
    priority: "HIGH",
    status: "ASSIGNED",
    assignedTechnicianId: "t4v5w6-7711",
    assignedTechnicianName: "Sarah Jenkins",
    targetSlaDeadline: "2026-09-22T18:00:00Z",
    confirmedChecklist: [
      { stepNumber: 1, instruction: "Verify starter motor battery terminal voltage and charger output.", completed: false }
    ],
    requiredTools: ["Multimeter", "Battery Load Tester"],
    requiredParts: [],
    safetyGuidelines: ["Battery acid hazard", "High-voltage generator output"],
    createdAt: "2026-09-22T09:15:00Z",
    updatedAt: "2026-09-22T09:15:00Z"
  }
];

export const mockJobUpdates = [
  {
    updateId: "upd-101",
    jobId: "j9f8e7d6-5c4b-3a2f-1e0d-9c8b7a6f5e4d",
    technicianId: "t3u2v1-9988",
    technicianName: "David Miller",
    updateType: "CHECKLIST_STEP",
    stepNumberCompleted: 1,
    notes: "LOTO verification complete. Voltage zero confirmed across Panel B-4 main breaker.",
    partsUsed: [],
    timestamp: "2026-09-22T11:45:00Z"
  },
  {
    updateId: "upd-102",
    jobId: "j9f8e7d6-5c4b-3a2f-1e0d-9c8b7a6f5e4d",
    technicianId: "t3u2v1-9988",
    technicianName: "David Miller",
    updateType: "NOTE",
    stepNumberCompleted: 2,
    notes: "Belt tension within tolerance. Found excessive dust accumulation on cooling fin shroud restricting airflow.",
    partsUsed: [],
    timestamp: "2026-09-22T12:15:00Z"
  }
];

export const mockReports = [
  {
    reportId: "rpt-9988-1122",
    reportNumber: "RPT-2026-0412",
    jobId: "j9f8e7d6-5c4b-3a2f-1e0d-9c8b7a6f5e4d",
    customerName: "Industrial Plastics Corp",
    assetName: "Industrial Air Compressor AC-4500",
    executiveSummary: "Successful diagnosis and replacement of faulty thermal overload relay TR-4500 on Air Compressor AC-4500. Shroud thermal blockage cleared; 45-minute continuous load test verified zero thermal cutouts.",
    workPerformed: "1. Executed High-Voltage LOTO protocol.\n2. Inspected belt drive and cleared shroud thermal blockage.\n3. Replaced degraded thermal overload relay TR-4500.\n4. Conducted 45-minute continuous operation load test at 120 PSI.",
    partsReplaced: [
      { partName: "Thermal Overload Relay 45A", partNumber: "TR-4500", quantity: 1 }
    ],
    technicianSignOff: { technicianName: "David Miller", signedAt: "2026-09-22T13:00:00Z" },
    customerSignOff: { customerName: "Robert Vance", signedAt: "2026-09-22T13:10:00Z" },
    pdfS3Key: "reports/2026/RPT-2026-0412.pdf",
    generatedAt: "2026-09-22T13:01:00Z"
  }
];
