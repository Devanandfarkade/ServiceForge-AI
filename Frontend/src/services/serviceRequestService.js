import { mockServiceRequests, mockAIAnalyses } from '../data/mockData';

let requestsStore = [...mockServiceRequests];
let aiAnalysesStore = { ...mockAIAnalyses };

export const serviceRequestService = {
  getRequests: async (filters = {}) => {
    let result = [...requestsStore];
    if (filters.status) {
      result = result.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.priority) {
      result = result.filter(r => r.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(r => 
        r.ticketNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.assetName.toLowerCase().includes(q) ||
        r.rawDescription.toLowerCase().includes(q)
      );
    }
    return result;
  },

  getRequestById: async (id) => {
    const req = requestsStore.find(r => r.requestId === id);
    if (!req) return null;
    const aiAnalysis = aiAnalysesStore[id] || null;
    return { ...req, aiAnalysis };
  },

  createRequest: async (requestData) => {
    const newId = `r${Date.now()}`;
    const newTicket = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalDesc = requestData.description || requestData.rawDescription || "";
    const newRequest = {
      requestId: newId,
      ticketNumber: newTicket,
      organizationId: "org-8841-alpha",
      customerId: requestData.customerId || "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
      customerName: requestData.customerName || "Industrial Plastics Corp",
      assetId: requestData.assetId || "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
      assetName: requestData.assetName || "Industrial Air Compressor AC-4500",
      submittedByUserId: "u1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      description: finalDesc,
      rawDescription: finalDesc,
      descriptionSource: requestData.descriptionSource || "typed",
      attachments: requestData.attachments || [],
      channel: requestData.channel || "WEB_PORTAL",
      status: "New",
      priority: requestData.priority || "HIGH",
      assignedTechnicianId: null,
      assignedTechnicianName: "Unassigned",
      hasAiAnalysis: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    requestsStore = [newRequest, ...requestsStore];
    return newRequest;
  },

  /**
   * Local Mock AI Analysis Flow simulating Amazon Bedrock (Claude 3.5 Sonnet)
   */
  analyzeRequest: async (requestId) => {
    // Simulate short processing delay
    await new Promise(resolve => setTimeout(resolve, 1400));

    const req = requestsStore.find(r => r.requestId === requestId);
    const description = req ? req.rawDescription : "Industrial issue detected";

    const aiOutput = {
      analysisId: `ai-${Math.floor(10000 + Math.random() * 90000)}`,
      requestId: requestId,
      bedrockModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      promptVersion: "v1.2",
      executionLatencyMs: 1420,
      summary: `Automated diagnostic extractions from issue: "${description.slice(0, 100)}..."`,
      detectedAssetCategory: req?.assetName?.toLowerCase().includes("chiller") ? "HVAC" : "COMPRESSOR",
      symptoms: [
        "Abnormal noise vibration under load",
        "Operational shutdown threshold reached",
        "Thermal rise detected on primary stage"
      ],
      recommendedPriority: req?.priority || "HIGH",
      recommendedSkillProfile: "Senior HVAC / Pneumatics L3 Certified Technician",
      suggestedInspectionSteps: [
        { stepNumber: 1, instruction: "Perform Lockout/Tagout (LOTO) electrical safety lockout.", critical: true },
        { stepNumber: 2, instruction: "Inspect cooling fan shroud, belt tension, and shaft bearing alignment.", critical: false },
        { stepNumber: 3, instruction: "Test thermal overload relay wiring and measure operating resistance.", critical: true },
        { stepNumber: 4, instruction: "Check lubricant oil level and check for metallic friction debris.", critical: false }
      ],
      suggestedTools: [
        "Digital Multimeter (CAT IV)",
        "FLIR Thermal Imaging Camera",
        "Belt Tension Gauge"
      ],
      suggestedParts: [
        { partName: "Thermal Overload Relay 45A", partNumber: "TR-4500", optional: false },
        { partName: "Heavy Duty Drive Belt", partNumber: "DB-4500", optional: true }
      ],
      safetyConsiderations: [
        "Mandatory High-Voltage LOTO verification before opening enclosure.",
        "Thermal burn hazard on compressor head (operates > 85°C).",
        "Pneumatic pressure release requirement prior to disassembly."
      ],
      missingInformation: [
        "Digital control panel error code log was not included in initial report."
      ],
      confidenceScore: 0.94,
      reviewStatus: "PENDING_REVIEW",
      createdAt: new Date().toISOString()
    };

    aiAnalysesStore[requestId] = aiOutput;
    
    // Update request status
    requestsStore = requestsStore.map(r => 
      r.requestId === requestId ? { ...r, status: "AI Ready", hasAiAnalysis: true, updatedAt: new Date().toISOString() } : r
    );

    return aiOutput;
  }
};
