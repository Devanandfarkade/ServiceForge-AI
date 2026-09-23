import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { PDFReportModal } from '../components/ui/PDFReportModal';
import { serviceJobService } from '../services/serviceJobService';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ServiceJobDetailPage({ id }) {
  const { navigate } = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checklist');
  const [safetyConfirmed, setSafetyConfirmed] = useState(true);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      try {
        const data = await serviceJobService.getJobById(id);
        setJob(data);
      } catch (err) {
        console.error('Failed to load job:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading service job details..." />;
  if (!job) return <div className="p-8 text-center text-slate-500 font-semibold">Service Job Not Found</div>;

  const tabs = [
    { id: 'checklist', label: 'Inspection Checklist', count: job.confirmedChecklist?.length || 4 },
    { id: 'updates', label: 'Field Updates', count: job.updates?.length || 2 },
    { id: 'tools', label: 'Tools & Parts' },
    { id: 'report', label: 'Service Report' }
  ];

  const handleToggleStep = async (stepNumber) => {
    const updated = await serviceJobService.toggleChecklistStep(job.jobId, stepNumber);
    setJob(prev => ({ ...prev, confirmedChecklist: updated.confirmedChecklist }));
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdateText.trim()) return;
    const upd = await serviceJobService.addJobUpdate(job.jobId, { notes: newUpdateText, updateType: 'NOTE' });
    setJob(prev => ({ ...prev, updates: [...(prev.updates || []), upd] }));
    setNewUpdateText('');
  };

  const handleCompleteJob = async () => {
    await serviceJobService.completeJob(job.jobId);
    setJob(prev => ({ ...prev, status: 'COMPLETED' }));
    setPdfModalOpen(true);
  };

  const completedCount = job.confirmedChecklist?.filter(c => c.completed).length || 0;
  const totalCount = job.confirmedChecklist?.length || 0;

  const reportData = {
    reportNumber: 'RPT-2026-0412',
    customerName: job.customerName,
    assetName: job.assetName,
    jobIdNumber: job.jobIdNumber,
    workPerformed: 'Replaced thermal overload relay on compressor AC-4500. Lockout/Tagout safety protocol verified on breaker Panel B-4 prior to inspection. Operating pressure restored to standard 125 PSI with thermal readings within nominal thresholds (68°C).'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PDF Document Viewer & Print Modal */}
      <PDFReportModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        reportData={reportData}
      />

      {/* Top Header matching Image 1 & 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black text-blue-600 dark:text-blue-400">{job.jobIdNumber}</span>
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {job.title}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
            ← Back to Jobs
          </Button>
          {job.status !== 'COMPLETED' && (
            <Button variant="success" size="md" onClick={handleCompleteJob}>
              Complete Job & Generate AI Report
            </Button>
          )}
        </div>
      </div>

      {/* Primary Customer & Asset Metadata Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Customer</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{job.customerName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Equipment</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{job.assetName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Tech</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{job.assignedTechnicianName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">SLA Target</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">9:30 PM</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Inspection Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Step-by-Step Inspection Checklist
            </h2>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full">
              {completedCount}/{totalCount} Completed
            </span>
          </div>

          <div className="space-y-3">
            {job.confirmedChecklist.map((step) => (
              <Card 
                key={step.stepNumber} 
                onClick={() => handleToggleStep(step.stepNumber)}
                className={`p-4 cursor-pointer transition-all ${
                  step.completed 
                    ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-500/5 dark:border-emerald-500/30' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                      step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {step.completed ? '✓' : step.stepNumber}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      <span className="mr-1">Step {step.stepNumber}:</span>
                      {step.instruction}
                    </div>
                  </div>
                  {step.completed && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      Verified 5:15 PM
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* LOTO Safety Requirement Callout Box */}
          <Card className="p-4 bg-amber-50/80 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              <span>⚠</span> Lockout/Tagout (LOTO) Safety Requirement
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
              Confirm lockout/tagout procedure executed before beginning work on site. Verify zero electrical voltage across breaker Panel B-4.
            </p>
            <label className="pt-1 flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
              <input 
                type="checkbox"
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              Confirm LOTO procedure executed before work
            </label>
          </Card>
        </div>
      )}

      {/* TAB 2: Field Updates */}
      {activeTab === 'updates' && (
        <Card className="space-y-4 p-5">
          <CardHeader><CardTitle>Field Progress Updates</CardTitle></CardHeader>
          <div className="space-y-3">
            {job.updates.map((u, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>{u.author}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(u.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{u.notes}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddUpdate} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Log thermal readings, voltage test notes..." 
              value={newUpdateText}
              onChange={(e) => setNewUpdateText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs"
            />
            <Button type="submit" variant="primary" size="sm">Save Update</Button>
          </form>
        </Card>
      )}

      {/* TAB 3: Tools & Parts */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Required Tools</CardTitle></CardHeader>
            <div className="flex flex-wrap gap-2">
              {job.requiredTools.map((t, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
                  🔧 {t}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Required Parts</CardTitle></CardHeader>
            <div className="flex flex-wrap gap-2">
              {job.requiredParts.map((p, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-500/30">
                  📦 {p.partName} ({p.quantity}x)
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: Service Report */}
      {activeTab === 'report' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Service Completion Report</h3>
              <p className="text-xs text-slate-500 font-medium">Signed & Archived under Apex Compliance Standards</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setPdfModalOpen(true)}>
              View Signed PDF Report 📄
            </Button>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
            <div className="font-bold text-slate-900 dark:text-slate-100">Work Execution Summary:</div>
            <p>
              Replaced thermal overload relay on compressor AC-4500. Lockout/Tagout safety protocol verified on breaker Panel B-4 prior to inspection. Operating pressure restored to standard 125 PSI with thermal readings within nominal thresholds.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
