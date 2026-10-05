import { liveServiceRequestService } from './liveServiceRequestService';

export const serviceRequestService = {
  getRequests: (filters) => liveServiceRequestService.getRequests(filters),
  getRequestById: (id) => liveServiceRequestService.getRequestById(id),
  createRequest: (requestData) => liveServiceRequestService.createRequest(requestData),
  updateRequest: (id, updates) => liveServiceRequestService.updateRequest(id, updates),
  patchRequest: (id, updates) => liveServiceRequestService.patchRequest(id, updates),
  analyzeRequest: (requestId) => liveServiceRequestService.analyzeRequest(requestId)
};

