import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { reportService } from '../services/reportService';
import { Modal } from '../components/ui/Modal';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Reports & Service Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Generated AI Service Completion Reports, SLA compliance, and operational metrics.</p>
        </div>
      </div>

      {/* Analytics Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Rate</span>
          <div className="text-3xl font-black text-emerald-400 mt-2">98.4%</div>
          <p className="text-[11px] text-slate-400 mt-1">+2.1% from last month</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Triage Time</span>
          <div className="text-3xl font-black text-cyan-400 mt-2">1.4 min</div>
          <p className="text-[11px] text-slate-400 mt-1">Via Amazon Bedrock</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First-Time Fix Rate</span>
          <div className="text-3xl font-black text-purple-400 mt-2">94.2%</div>
          <p className="text-[11px] text-slate-400 mt-1">AI checklist accuracy</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports Generated</span>
          <div className="text-3xl font-black text-slate-100 mt-2">148</div>
          <p className="text-[11px] text-slate-400 mt-1">Stored in Amazon S3</p>
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
          <div className="divide-y divide-slate-800/60">
            {reports.map((rpt) => (
              <div key={rpt.reportId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-cyan-400">{rpt.reportNumber}</span>
                    <Badge variant="emerald">Signed & Archived</Badge>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{rpt.assetName} — {rpt.customerName}</div>
                  <p className="text-xs text-slate-400 line-clamp-1">{rpt.executiveSummary}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedReport(rpt)}>
                    View Report
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Report Modal Viewer */}
      {selectedReport && (
        <Modal 
          isOpen={Boolean(selectedReport)} 
          onClose={() => setSelectedReport(null)}
          title={`Service Completion Report — ${selectedReport.reportNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between">
              <div>
                <span className="text-slate-400 block font-medium">Customer:</span>
                <span className="text-slate-100 font-semibold">{selectedReport.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Equipment:</span>
                <span className="text-slate-100 font-semibold">{selectedReport.assetName}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Executive Summary</span>
              <p className="text-slate-200 leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800">{selectedReport.executiveSummary}</p>
            </div>

            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Work Performed Narrative</span>
              <pre className="text-slate-300 font-sans whitespace-pre-wrap leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800">{selectedReport.workPerformed}</pre>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between text-emerald-300">
              <div>
                <span className="block font-bold">Technician Sign-Off:</span>
                <span>{selectedReport.technicianSignOff.technicianName} ({new Date(selectedReport.technicianSignOff.signedAt).toLocaleDateString()})</span>
              </div>
              <div>
                <span className="block font-bold">Customer Sign-Off:</span>
                <span>{selectedReport.customerSignOff.customerName} ({new Date(selectedReport.customerSignOff.signedAt).toLocaleDateString()})</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
