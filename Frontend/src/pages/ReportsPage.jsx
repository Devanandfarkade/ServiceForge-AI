import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { reportService } from '../services/reportService';
import { PDFReportModal } from '../components/ui/PDFReportModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    async function loadReports() {
      const data = await reportService.getReports();
      setReports(data);
      setLoading(false);
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Reports & Service Analytics</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Generated AI Service Completion Reports, SLA compliance audit logs, and operational metrics.
          </p>
        </div>
      </div>

      {/* Analytics Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">98.4%</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">+2.1% from last month</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Triage Time</span>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">1.4 min</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Via Amazon Bedrock</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">First-Time Fix Rate</span>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">94.2%</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">AI checklist accuracy</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-slate-700">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reports Generated</span>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">148</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Stored in Amazon S3</p>
        </Card>
      </div>

      {/* Generated Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Service Completion Reports Archive</CardTitle>
        </CardHeader>
        {loading ? (
          <LoadingSpinner label="Loading service reports..." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((rpt) => (
              <div key={rpt.reportId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{rpt.reportNumber}</span>
                    <Badge variant="emerald">Signed & Archived</Badge>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{rpt.assetName} — {rpt.customerName}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{rpt.executiveSummary}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedReport(rpt)}>
                    View PDF Report 📄
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* PDF Document Modal Viewer */}
      <PDFReportModal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        reportData={selectedReport}
      />
    </div>
  );
}
