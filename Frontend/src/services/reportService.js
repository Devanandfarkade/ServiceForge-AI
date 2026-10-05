import { apiClient } from '../lib/apiClient';

export const reportService = {
  getReports: async () => {
    const data = await apiClient.get('/reports');
    return Array.isArray(data) ? data : [];
  },

  getReportByJobId: async (jobId) => {
    if (!jobId) return null;
    const data = await apiClient.get(`/service-jobs/${jobId}/report`);
    return data || null;
  },

  generateReport: async (job) => {
    if (!job || !job.jobId) return null;
    return await apiClient.post(`/service-jobs/${job.jobId}/report/generate`, {});
  }
};


