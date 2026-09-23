import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { technicianService } from '../services/technicianService';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function TechniciansPage() {
  const { navigate } = useRouter();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTechs() {
      const data = await technicianService.getTechnicians();
      setTechnicians(data);
      setLoading(false);
    }
    loadTechs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Technicians & Field Dispatch</h1>
          <p className="text-xs text-slate-400 mt-1">
            Skill matrix matching, certified competencies, and real-time duty status.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading technicians..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {technicians.map((tech) => (
            <Card key={tech.technicianId} className="space-y-4 hover:border-slate-700">
              <div className="flex items-center gap-3">
                <Avatar src={tech.avatarUrl} name={tech.fullName} size="lg" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">{tech.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{tech.employeeId} • {tech.role}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <span>★ {tech.rating}</span>
                    <span className="text-slate-500 font-normal">({tech.completedJobsCount} completed)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-slate-400">
                  <span>Current Status:</span>
                  <span className={`font-bold ${tech.currentStatus === 'AVAILABLE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tech.currentStatus}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Active Jobs:</span>
                  <span className="font-bold text-slate-200">{tech.activeJobCount} job</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Location:</span>
                  <span className="text-slate-300">{tech.currentLocation.city}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Certified Skills</span>
                <div className="flex flex-wrap gap-1">
                  {tech.skills.map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/technicians/${tech.technicianId}`)}
              >
                Open Mobile Technician Workspace →
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
