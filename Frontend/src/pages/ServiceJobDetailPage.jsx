import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { serviceJobService } from '../services/serviceJobService';
import { reportService } from '../services/reportService';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ServiceJobDetailPage({ id }) {
  const { navigate } = useRouter();
  const [job, setJob] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    async function loadJobDetails() {
      if (!id) return;
      const data = await serviceJobService.getJobById(id);
      setJob(data);
      const rpt = await reportService.getReportByJobId(id);
      setReport(rpt);
      setLoading(false);
    }
    loadJobDetails();
  }, [id]);

  const handleToggleStep = async (stepNumber) => {
    const updated = await serviceJobService.toggleChecklistStep(id, stepNumber);
    setJob(prev => ({ ...prev, confirmedChecklist: updated.confirmedChecklist }));
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const upd = await serviceJobService.addJobUpdate(id, { notes: newNote, updateType: 'NOTE' });
    setJob(prev => ({ ...prev, updates: [...(prev.updates || []), upd] }));
    setNewNote('');
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setTimeout(async () => {
      const rpt = await reportService.generateReport(job);
      await serviceJobService.completeJob(id);
      setReport(rpt);
      setJob(prev => ({ ...prev, status: 'COMPLETED' }));
      setGeneratingReport(false);
    }, 1200);
  };

  if (loading) return <LoadingSpinner label="Loading job package..." />;
  if (!job) return <div className="text-slate-400 p-8 text-center">Service Job Not Found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Job Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black font-mono text-cyan-400">{job.jobIdNumber}</h1>
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
          </div>
          <p className="text-sm font-semibold text-slate-100 mt-1">{job.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/jobs')}>← Back to Jobs</Button>
          {job.status !== 'COMPLETED' ? (
            <Button variant="success" onClick={handleGenerateReport} disabled={generatingReport}>
              {generatingReport ? '✨ Generating AI Report...' : '✔ Complete Job & Generate AI Report'}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => navigate('/reports')}>View Final Service Report →</Button>
          )}
        </div>
      </div>

      {/* Safety Guidelines Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <span className="text-amber-400 text-lg">⚠</span>
        <div>
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Mandatory Field Safety Guidelines</div>
          <div className="space-y-1 mt-1">
            {job.safetyGuidelines.map((sg, idx) => (
              <div key={idx} className="text-xs text-amber-200/90 font-medium">• {sg}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist & Updates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step-by-step Inspection Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>AI Confirmed Inspection Checklist</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {job.confirmedChecklist.map((step) => (
                <div 
                  key={step.stepNumber}
                  onClick={() => handleToggleStep(step.stepNumber)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    step.completed 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={step.completed} 
                    onChange={() => {}}
                    className="mt-1 accent-cyan-500 rounded cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold font-mono text-cyan-400 mr-2">Step {step.stepNumber}:</span>
                    {step.instruction}
                    {step.completedAt && (
                      <span className="block text-[10px] text-emerald-400 font-mono mt-1">
                        ✔ Completed on {new Date(step.completedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Technician Field Updates Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Field Updates & Progress Notes</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add real-time field observations or parts log..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <Button type="submit" variant="secondary" size="sm">+ Log Note</Button>
              </form>

              <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                {(job.updates || []).map((upd) => (
                  <div key={upd.updateId} className="pt-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{upd.technicianName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(upd.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 italic">"{upd.notes}"</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Details & Tools */}
        <div className="space-y-6">
          <Card className="space-y-3 text-xs">
            <CardHeader>
              <CardTitle>Job Context</CardTitle>
            </CardHeader>
            <div>
              <span className="text-slate-400 block font-medium">Customer:</span>
              <span className="text-slate-100 font-semibold">{job.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Target Equipment:</span>
              <span className="text-slate-100 font-semibold">{job.assetName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Assigned Technician:</span>
              <span className="text-cyan-400 font-semibold">{job.assignedTechnicianName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Target SLA Deadline:</span>
              <span className="text-slate-200 font-mono">{new Date(job.targetSlaDeadline).toLocaleString()}</span>
            </div>
          </Card>

          <Card className="space-y-3 text-xs">
            <CardHeader>
              <CardTitle>Required Tools & Parts</CardTitle>
            </CardHeader>
            <div>
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">Tools</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {job.requiredTools.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">🔧 {t}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">Parts</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {job.requiredParts.map((p, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px]">📦 {p.partName}</span>
                ))}
              </div>
            </div>
          </Card>

          {report && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span>✔</span> AI Service Report Generated
              </div>
              <p className="text-xs text-slate-300 line-clamp-3">{report.executiveSummary}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/reports')}>
                View Full Signed Report →
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
