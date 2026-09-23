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

  const handleCompleteJob = async () => {
    if (!activeJob) return;
    await serviceJobService.completeJob(activeJob.jobId);
    setActiveJob(prev => ({ ...prev, status: 'COMPLETED' }));
  };

  if (loading) return <LoadingSpinner label="Loading mobile field workspace..." />;
  if (!tech) return <div className="text-slate-500 p-8 text-center font-bold">Technician Not Found.</div>;

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      {/* Mobile Field Header matching Image 1 & 2 */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm">
            {tech.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              MOBILE FIELD WORKSPACE
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              {tech.fullName}
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold">
              {tech.role}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/technicians')}>
          ← Back
        </Button>
      </div>

      {activeJob ? (
        <div className="space-y-4">
          {/* Active Job Header Card */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {activeJob.jobIdNumber}
              </span>
              <div className="flex gap-1.5">
                <PriorityBadge priority={activeJob.priority} />
                <StatusBadge status={activeJob.status} />
              </div>
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
              {activeJob.title}
            </h3>
            
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <div>🏢 <span className="font-bold text-slate-900 dark:text-slate-100">{activeJob.customerName}</span></div>
              <div>📍 <span className="text-slate-500">Plant 2, Compressor Room B, Bay 4</span></div>
              <div>⚙️ <span>{activeJob.assetName}</span></div>
            </div>
          </Card>

          {/* LOTO Safety Requirement Callout Box */}
          <Card className={`p-4 transition-all ${
            safetyAcknowledged 
              ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'border-amber-300 bg-amber-50 dark:bg-amber-500/10'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                <span>⚠</span> LOCKOUT/TAGOUT (LOTO) SAFETY REQUIREMENT
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                Confirm lockout/tagout procedure executed before beginning work on site. Verify zero electrical voltage across breaker Panel B-4.
              </p>
              <label className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={safetyAcknowledged}
                  onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                Confirm LOTO procedure executed before work
              </label>
            </div>
          </Card>

          {/* Interactive Checklist */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Interactive Checklist
              </h4>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {activeJob.confirmedChecklist.filter(c => c.completed).length}/{activeJob.confirmedChecklist.length} Done
              </span>
            </div>

            <div className="space-y-2">
              {activeJob.confirmedChecklist.map((step) => (
                <div
                  key={step.stepNumber}
                  onClick={() => handleToggleStep(step.stepNumber)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    step.completed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                  />
                  <div className="flex-1 text-xs leading-snug font-bold">
                    <span className="text-blue-600 dark:text-blue-400 mr-1">Step {step.stepNumber}:</span>
                    {step.instruction}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Field Progress Logger */}
          <Card className="space-y-3 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Field Progress Logger
            </h4>
            <form onSubmit={handleAddNote} className="space-y-2.5">
              <input
                type="text"
                placeholder="Log field observation or parts installed..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" className="flex-1 min-h-[38px]">
                  📷 Add Photo
                </Button>
                <Button type="submit" variant="primary" size="sm" className="flex-1 min-h-[38px]">
                  + Save Note
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-500 space-y-2">
          <div className="text-xl">🟢</div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Available for Dispatch
          </div>
        </Card>
      )}

      {/* Sticky Bottom Action Bar matching Image 1 & 2 */}
      {activeJob && activeJob.status !== 'COMPLETED' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 border-t border-slate-200 backdrop-blur-md z-40 flex items-center justify-between gap-3 max-w-md mx-auto shadow-2xl dark:bg-slate-900/95 dark:border-slate-800">
          <Button variant="success" size="md" className="w-full min-h-[44px] text-xs font-bold" onClick={handleCompleteJob}>
            Mark Job Completed
          </Button>
        </div>
      )}
    </div>
  );
}
