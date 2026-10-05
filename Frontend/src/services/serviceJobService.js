import { liveServiceJobService } from './liveServiceJobService';

export const serviceJobService = {
  getJobs: (filters) => liveServiceJobService.getJobs(filters),
  getJobById: (id) => liveServiceJobService.getJobById(id),
  createJobFromRequest: (request, aiAnalysis) => liveServiceJobService.createJobFromRequest(request, aiAnalysis),
  assignTechnician: (jobId, technician) => liveServiceJobService.assignTechnician(jobId, technician),
  toggleChecklistStep: (jobId, stepNumber) => liveServiceJobService.toggleChecklistStep(jobId, stepNumber),
  addJobUpdate: (jobId, updateData) => liveServiceJobService.addJobUpdate(jobId, updateData),
  completeJob: (jobId) => liveServiceJobService.completeJob(jobId)
};

