import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { serviceRequestService } from '../services/serviceRequestService';
import { serviceJobService } from '../services/serviceJobService';
import { technicianService } from '../services/technicianService';
import { useRouter } from '../lib/router';

export function DashboardPage() {
  const { navigate } = useRouter();
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [reqsData, jobsData, techsData] = await Promise.all([
          serviceRequestService.getRequests(),
          serviceJobService.getJobs(),
          technicianService.getTechnicians()
        ]);
        setRequests(reqsData);
        setJobs(jobsData);
        setTechnicians(techsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const openJobsCount = jobs.filter(j => j.status !== 'COMPLETED').length;
  const highPriorityCount = requests.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL').length;
  const aiReadyCount = requests.filter(r => r.status === 'AI Ready').length;
  const activeTechsCount = technicians.filter(t => t.currentStatus === 'AVAILABLE' || t.currentStatus === 'ON_JOB').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Service Operations Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor service demand, technician workload, and AI-prepared jobs in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => navigate('/requests/new')}>
            + New Service Request
          </Button>
        </div>
      </div>

      {/* AI Operations Insight Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">AI Operations Insight</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Bedrock Active</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {aiReadyCount} service request{aiReadyCount !== 1 ? 's are' : ' is'} processed with AI decision support and ready for technician assignment.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/requests')}>
          Review AI Jobs →
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Jobs</span>
            <span className="text-cyan-400 bg-cyan-500/10 p-2 rounded-xl text-xs font-mono">⚡ SLA Active</span>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-3">{openJobsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 3 active customer sites</p>
        </Card>

        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Priority</span>
            <span className="text-amber-400 bg-amber-500/10 p-2 rounded-xl text-xs">⚠️ Urgent</span>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">{highPriorityCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Requires dispatch under 4h SLA</p>
        </Card>

        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Ready</span>
            <span className="text-purple-400 bg-purple-500/10 p-2 rounded-xl text-xs">✨ Triage Complete</span>
          </div>
          <div className="text-3xl font-black text-purple-400 mt-3">{aiReadyCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Decision support prepped</p>
        </Card>

        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Techs</span>
            <span className="text-emerald-400 bg-emerald-500/10 p-2 rounded-xl text-xs">🟢 Online</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">{activeTechsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Field specialists deployed</p>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Service Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Service Jobs & SLA Countdown</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>View All Jobs →</Button>
            </CardHeader>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div 
                  key={job.jobId}
                  onClick={() => navigate(`/jobs/${job.jobId}`)}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{job.jobIdNumber}</span>
                      <PriorityBadge priority={job.priority} />
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-sm font-semibold text-slate-100">{job.title}</div>
                    <div className="text-xs text-slate-400">
                      Customer: <span className="text-slate-300 font-medium">{job.customerName}</span> | Asset: <span className="text-slate-300 font-medium">{job.assetName}</span>
                    </div>
                  </div>
                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Assigned Tech</div>
                    <div className="text-xs font-medium text-slate-200">{job.assignedTechnicianName}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Service Requests Triage Stream */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Service Intake Triage</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>Manage Queue →</Button>
            </CardHeader>
            <div className="divide-y divide-slate-800/60">
              {requests.map((req) => (
                <div 
                  key={req.requestId}
                  onClick={() => navigate(`/requests/${req.requestId}`)}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/20 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{req.ticketNumber}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="text-xs font-medium text-slate-200 line-clamp-1">{req.rawDescription}</div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <PriorityBadge priority={req.priority} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Technician Workload & Recent Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Technician Uptime & Workload</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {technicians.map((tech) => (
                <div 
                  key={tech.technicianId}
                  onClick={() => navigate(`/technicians/${tech.technicianId}`)}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={tech.avatarUrl} name={tech.fullName} size="md" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{tech.fullName}</div>
                      <div className="text-[10px] text-slate-400">{tech.role}</div>
                      <div className="flex gap-1 mt-1">
                        {tech.skills.slice(0, 2).map((sk, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      tech.currentStatus === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    <div className="text-[10px] font-semibold text-slate-400 mt-1">{tech.currentStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations Activity Stream</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-800/60">
                <span className="text-cyan-400 font-bold">●</span>
                <div>
                  <span className="font-semibold text-slate-200">AI Triage Completed</span> for ticket <span className="font-mono text-cyan-400">REQ-2026-0841</span>.
                  <div className="text-[10px] text-slate-400 mt-0.5">10 mins ago</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-800/60">
                <span className="text-emerald-400 font-bold">●</span>
                <div>
                  Technician <span className="font-semibold text-slate-200">David Miller</span> logged LOTO verification step.
                  <div className="text-[10px] text-slate-400 mt-0.5">35 mins ago</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold">●</span>
                <div>
                  <span className="font-semibold text-slate-200">New Request</span> submitted by Industrial Plastics Corp.
                  <div className="text-[10px] text-slate-400 mt-0.5">1 hour ago</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
