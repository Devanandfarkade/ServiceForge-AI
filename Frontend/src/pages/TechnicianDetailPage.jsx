import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { technicianService } from '../services/technicianService';
import { serviceJobService } from '../services/serviceJobService';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function TechnicianDetailPage({ id }) {
  const { navigate } = useRouter();
  const [tech, setTech] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    async function loadWorkspace() {
      if (!id) return;
      const t = await technicianService.getTechnicianById(id);
      setTech(t);
      const jobs = await serviceJobService.getJobs({ technicianId: id });
      if (jobs.length > 0) {
        const j = await serviceJobService.getJobById(jobs[0].jobId);
        setActiveJob(j);
      }
      setLoading(false);
    }
    loadWorkspace();
  }, [id]);

  const handleToggleStep = async (stepNumber) => {
    if (!activeJob) return;
    const updated = await serviceJobService.toggleChecklistStep(activeJob.jobId, stepNumber);
    setActiveJob(prev => ({ ...prev, confirmedChecklist: updated.confirmedChecklist }));
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !activeJob) return;
    const upd = await serviceJobService.addJobUpdate(activeJob.jobId, { notes: noteText, updateType: 'NOTE' });
    setActiveJob(prev => ({ ...prev, updates: [...(prev.updates || []), upd] }));
    setNoteText('');
  };

  if (loading) return <LoadingSpinner label="Loading technician workspace..." />;
  if (!tech) return <div className="text-slate-400 p-8 text-center">Technician Not Found.</div>;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Mobile Workspace Banner Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Mobile Technician Workspace</div>
          <h2 className="text-lg font-black text-slate-100">{tech.fullName}</h2>
          <p className="text-xs text-slate-400 font-mono">{tech.role} • {tech.employeeId}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/technicians')}>← Back</Button>
      </div>

      {activeJob ? (
        <div className="space-y-4">
          {/* Active Job Header Card */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400">{activeJob.jobIdNumber}</span>
              <div className="flex gap-1.5">
                <PriorityBadge priority={activeJob.priority} />
                <StatusBadge status={activeJob.status} />
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-100">{activeJob.title}</h3>
            
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div>🏢 <span className="font-semibold text-slate-100">{activeJob.customerName}</span></div>
              <div>📍 <span className="text-slate-400">Plant 2, Compressor Room B, Bay 4</span></div>
              <div>⚙️ <span className="text-slate-300">{activeJob.assetName}</span></div>
            </div>
          </Card>

          {/* LOTO Safety Acknowledgement Banner */}
          <Card className={`transition-all ${safetyAcknowledged ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/10'}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <span>⚠</span> LOTO & High-Voltage Safety Guidelines
              </div>
              <div className="text-xs text-amber-200/90 space-y-1 font-medium">
                {activeJob.safetyGuidelines.map((sg, idx) => (
                  <div key={idx}>• {sg}</div>
                ))}
              </div>
              <label className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={safetyAcknowledged}
                  onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                I acknowledge Lockout/Tagout (LOTO) safety protocol before site entry
              </label>
            </div>
          </Card>

          {/* Step-by-Step Interactive Inspection Checklist */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Interactive Inspection Checklist</h4>
              <span className="text-xs font-mono text-cyan-400">
                {activeJob.confirmedChecklist.filter(c => c.completed).length} / {activeJob.confirmedChecklist.length} Done
              </span>
            </div>

            <div className="space-y-2">
              {activeJob.confirmedChecklist.map((step) => (
                <div
                  key={step.stepNumber}
                  onClick={() => handleToggleStep(step.stepNumber)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    step.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => {}}
                    className="mt-0.5 accent-cyan-500 rounded cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold font-mono text-cyan-400 mr-1.5">Step {step.stepNumber}:</span>
                    {step.instruction}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Log Field Note Form */}
          <Card className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Log Field Progress & Photos</h4>
            <form onSubmit={handleAddNote} className="space-y-2">
              <input
                type="text"
                placeholder="Log thermal readings, voltage test notes, or parts installed..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" className="flex-1">📷 Add Photo</Button>
                <Button type="submit" variant="primary" size="sm" className="flex-1">+ Save Note</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-400 space-y-2">
          <div className="text-2xl">🟢</div>
          <div className="text-sm font-semibold text-slate-200">No Active Dispatched Job</div>
          <p className="text-xs">Technician is currently available for dispatch assignment.</p>
        </Card>
      )}
    </div>
  );
}
