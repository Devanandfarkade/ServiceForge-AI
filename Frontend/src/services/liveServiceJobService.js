/**
 * ServiceForge AI — Live Service Job Service (AWS API Gateway)
 *
 * Wraps the API client for all /service-jobs endpoints.
 *
 * Backend endpoints (from API_SPEC.md):
 *   GET    /service-jobs              — list with optional filters
 *   GET    /service-jobs/{id}        — detail with updates timeline
 *   POST   /service-jobs             — create from approved request
 *   PATCH  /service-jobs/{id}/assign — assign technician
 *   PATCH  /service-jobs/{id}/checklist/{step} — toggle checklist step
 *   POST   /service-jobs/{id}/updates — add field update / note
 *   PATCH  /service-jobs/{id}/complete — mark complete
 */

import { apiClient } from '../lib/apiClient';

export const liveServiceJobService = {
  /**
   * Fetch all service jobs with optional filters.
   * Query params: status, priority, technicianId
   */
  getJobs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.technicianId) params.set('technicianId', filters.technicianId);

    const qs = params.toString();
    const path = qs ? `/service-jobs?${qs}` : '/service-jobs';
    return apiClient.get(path);
  },

  /**
   * Fetch a single service job by ID (includes updates timeline).
   */
  getJobById: async (id) => {
    return apiClient.get(`/service-jobs/${id}`);
  },

  /**
   * Create a new service job from an approved service request.
   * @param {object} request - The service request object
   * @param {object} aiAnalysis - AI analysis output
   */
  createJobFromRequest: async (request, aiAnalysis) => {
    return apiClient.post('/service-jobs', {
      requestId: request.requestId,
      aiAnalysisId: aiAnalysis?.analysisId || null,
    });
  },

  /**
   * Assign a technician to a job.
   * @param {string} jobId
   * @param {{ technicianId: string, fullName: string }} technician
   */
  assignTechnician: async (jobId, technician) => {
    return apiClient.patch(`/service-jobs/${jobId}/assign`, {
      technicianId: technician.technicianId,
    });
  },

  /**
   * Toggle a checklist step completion status.
   * @param {string} jobId
   * @param {number} stepNumber
   */
  toggleChecklistStep: async (jobId, stepNumber) => {
    return apiClient.patch(`/service-jobs/${jobId}/checklist/${stepNumber}`, {});
  },

  /**
   * Add a field update/note to a job.
   * @param {string} jobId
   * @param {object} updateData
   */
  addJobUpdate: async (jobId, updateData) => {
    return apiClient.post(`/service-jobs/${jobId}/updates`, updateData);
  },

  /**
   * Mark a job as complete.
   * @param {string} jobId
   */
  completeJob: async (jobId) => {
    return apiClient.patch(`/service-jobs/${jobId}/complete`, {});
  },
};
