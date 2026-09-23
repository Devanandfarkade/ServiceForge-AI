import { mockServiceJobs, mockJobUpdates } from '../data/mockData';

let jobsStore = [...mockServiceJobs];
let jobUpdatesStore = [...mockJobUpdates];

export const serviceJobService = {
  getJobs: async (filters = {}) => {
    let result = [...jobsStore];
    if (filters.status) {
      result = result.filter(j => j.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.priority) {
      result = result.filter(j => j.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.technicianId) {
      result = result.filter(j => j.assignedTechnicianId === filters.technicianId);
    }
    return result;
  },

  getJobById: async (id) => {
    const job = jobsStore.find(j => j.jobId === id);
    if (!job) return null;
    const updates = jobUpdatesStore.filter(u => u.jobId === id);
    return { ...job, updates };
  },

  createJobFromRequest: async (request, aiAnalysis) => {
    const newJobId = `j${Date.now()}`;
    const newJobNumber = `JOB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newJob = {
      jobId: newJobId,
      jobIdNumber: newJobNumber,
      organizationId: "org-8841-alpha",
      requestId: request.requestId,
      customerId: request.customerId,
      customerName: request.customerName,
      assetId: request.assetId,
      assetName: request.assetName,
      title: `${request.assetName} Service & Repair`,
      priority: aiAnalysis?.recommendedPriority || request.priority || "HIGH",
      status: "ASSIGNED",
      assignedTechnicianId: "t3u2v1-9988",
      assignedTechnicianName: "David Miller",
      targetSlaDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      confirmedChecklist: (aiAnalysis?.suggestedInspectionSteps || []).map(step => ({
        stepNumber: step.stepNumber,
        instruction: step.instruction,
        completed: false,
        completedAt: null
      })),
      requiredTools: aiAnalysis?.suggestedTools || ["Digital Multimeter", "Thermal Imager"],
      requiredParts: aiAnalysis?.suggestedParts || [],
      safetyGuidelines: aiAnalysis?.safetyConsiderations || ["LOTO Safety Lockout Required"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    jobsStore = [newJob, ...jobsStore];
    return newJob;
  },

  assignTechnician: async (jobId, technician) => {
    jobsStore = jobsStore.map(j => 
      j.jobId === jobId ? { 
        ...j, 
        assignedTechnicianId: technician.technicianId,
        assignedTechnicianName: technician.fullName,
        status: "ASSIGNED",
        updatedAt: new Date().toISOString()
      } : j
    );
    return jobsStore.find(j => j.jobId === jobId);
  },

  toggleChecklistStep: async (jobId, stepNumber) => {
    jobsStore = jobsStore.map(j => {
      if (j.jobId === jobId) {
        const updatedChecklist = j.confirmedChecklist.map(item => {
          if (item.stepNumber === stepNumber) {
            return {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : null
            };
          }
          return item;
        });
        return { ...j, confirmedChecklist: updatedChecklist, updatedAt: new Date().toISOString() };
      }
      return j;
    });

    return jobsStore.find(j => j.jobId === jobId);
  },

  addJobUpdate: async (jobId, updateData) => {
    const newUpdate = {
      updateId: `upd-${Date.now()}`,
      jobId,
      technicianId: updateData.technicianId || "t3u2v1-9988",
      technicianName: updateData.technicianName || "David Miller",
      updateType: updateData.updateType || "NOTE",
      stepNumberCompleted: updateData.stepNumberCompleted || null,
      notes: updateData.notes || "",
      partsUsed: updateData.partsUsed || [],
      timestamp: new Date().toISOString()
    };

    jobUpdatesStore = [...jobUpdatesStore, newUpdate];
    return newUpdate;
  },

  completeJob: async (jobId) => {
    jobsStore = jobsStore.map(j => 
      j.jobId === jobId ? { ...j, status: "COMPLETED", updatedAt: new Date().toISOString() } : j
    );
    return jobsStore.find(j => j.jobId === jobId);
  }
};
