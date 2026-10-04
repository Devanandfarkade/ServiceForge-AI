/**
 * ServiceForge AI — Live Service Request Service (AWS API Gateway)
 *
 * Wraps the API client for all /service-requests endpoints.
 * Falls back gracefully to returning null / empty arrays when the backend
 * is unreachable so the UI can fall back to mock data if needed.
 *
 * Backend endpoints (from API_SPEC.md):
 *   GET    /service-requests          — list with optional filters
 *   POST   /service-requests          — create
 *   GET    /service-requests/{id}     — detail
 *   POST   /service-requests/{id}/analyze  — trigger AI analysis
 */

import { apiClient } from '../lib/apiClient';

export const liveServiceRequestService = {
  /**
   * Fetch all service requests with optional filters.
   * Query params: status, priority, search
   */
  getRequests: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);

    const qs = params.toString();
    const path = qs ? `/service-requests?${qs}` : '/service-requests';
    return apiClient.get(path);
  },

  /**
   * Fetch a single service request by ID (includes AI analysis if available).
   */
  getRequestById: async (id) => {
    return apiClient.get(`/service-requests/${id}`);
  },

  /**
   * Create a new service request.
   * @param {object} requestData
   */
  createRequest: async (requestData) => {
    return apiClient.post('/service-requests', requestData);
  },

  /**
   * Update an existing service request (e.g. associate confirmed attachment IDs).
   * @param {string} id - Service request ID
   * @param {object} updates - Fields to update (e.g. { attachments: [...] })
   */
  updateRequest: async (id, updates) => {
    return apiClient.patch(`/service-requests/${id}`, updates);
  },

  /**
   * Alias for updateRequest.
   */
  patchRequest: async (id, updates) => {
    return apiClient.patch(`/service-requests/${id}`, updates);
  },

  /**
   * Trigger AI analysis for a service request.
   * @param {string} requestId
   */
  analyzeRequest: async (requestId) => {
    return apiClient.post(`/service-requests/${requestId}/analyze`, {});
  },
};
