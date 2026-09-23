import { mockReports } from '../data/mockData';

let reportsStore = [...mockReports];

export const reportService = {
  getReports: async () => {
    return [...reportsStore];
  },
  getReportByJobId: async (jobId) => {
    return reportsStore.find(r => r.jobId === jobId) || null;
  },
  generateReport: async (job) => {
    const newReport = {
      reportId: `rpt-${Date.now()}`,
      reportNumber: `RPT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      jobId: job.jobId,
      customerName: job.customerName,
      assetName: job.assetName,
      executiveSummary: `Synthesized completion summary for ${job.title}. All inspection steps executed successfully with zero safety incidents.`,
      workPerformed: `1. Verified LOTO safety lockout procedures.\n2. Executed complete diagnostic evaluation on ${job.assetName}.\n3. Verified parts installation and conducted load testing.`,
      partsReplaced: job.requiredParts || [],
      technicianSignOff: { technicianName: job.assignedTechnicianName || "David Miller", signedAt: new Date().toISOString() },
      customerSignOff: { customerName: "Robert Vance", signedAt: new Date().toISOString() },
      pdfS3Key: `reports/2026/RPT-2026-${Math.floor(1000 + Math.random() * 9000)}.pdf`,
      generatedAt: new Date().toISOString()
    };
    reportsStore = [newReport, ...reportsStore];
    return newReport;
  }
};
