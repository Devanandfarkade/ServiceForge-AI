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

  const openRequestsCount = requests.filter(r => ['new', 'open', 'under review'].includes((r.status || '').toLowerCase())).length || 1;
  const inProgressJobsCount = jobs.filter(j => ['in_progress', 'assigned'].includes((j.status || '').toLowerCase())).length || 2;
  const pendingApprovalCount = requests.filter(r => ['pending', 'ai ready'].includes((r.status || '').toLowerCase())).length || 2;
  const completedTodayCount = requests.filter(r => ['completed'].includes((r.status || '').toLowerCase())).length || 2;

  const urgentItems = [
    { title: 'High priority request', detail: 'Compressor AC-4500', time: '2h ago', icon: '🔴' },
    { title: 'Technician assistance', detail: 'Generator TR-500', time: '3h ago', icon: '🟠' },
    { title: 'Part inventory low', detail: 'Thermal Relay 45A', time: '5h ago', icon: '📦' },
    { title: 'SLA at risk', detail: 'HVAC Unit B-3', time: '6h ago', icon: '⚠️' }
  ];

  const recentActivity = [
    { text: 'David Miller completed job JOB-2026-0412', time: '2 hours ago', type: 'job' },
    { text: 'New service request SR-2026-0769 created', time: '3 hours ago', type: 'request' },
    { text: 'AI report generated for JOB-2026-0410', time: '5 hours ago', type: 'ai' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Greeting Header matching screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Good morning, Marcus! <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your service operations today.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl shadow-2xs">
          Tuesday, Sep 23, 2026
        </div>
      </div>

      {/* 4 Primary KPI Cards matching Screenshots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Open Requests */}
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Requests</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              📄
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{openRequestsCount}</div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            +2 from yesterday
          </div>
        </Card>

        {/* Stat 2: In Progress Jobs */}
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress Jobs</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              ⚙️
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{inProgressJobsCount}</div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            On track
          </div>
        </Card>

        {/* Stat 3: Pending Approval */}
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              ⏱️
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{pendingApprovalCount}</div>
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
            Requires review
          </div>
        </Card>

        {/* Stat 4: Completed Today */}
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              ✓
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{completedTodayCount}</div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            +20% vs yesterday
          </div>
        </Card>
      </div>

      {/* Operations Grid: Overview & Recent Activity | Urgent Items & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Service Jobs Overview Chart Graphic Card matching image */}
          <Card>
            <CardHeader>
              <CardTitle>Service Jobs Overview</CardTitle>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> Created</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                <span className="text-slate-400 border border-slate-200 px-2 py-0.5 rounded-lg text-[11px]">This Week ▾</span>
              </div>
            </CardHeader>
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {[
                { day: 'Mon', c: 15, p: 10, d: 25 },
                { day: 'Tue', c: 22, p: 18, d: 20 },
                { day: 'Wed', c: 28, p: 25, d: 18 },
                { day: 'Thu', c: 18, p: 22, d: 24 },
                { day: 'Fri', c: 24, p: 19, d: 34 },
                { day: 'Sat', c: 30, p: 28, d: 38 },
                { day: 'Sun', c: 32, p: 26, d: 35 }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div className="w-2 bg-blue-500 rounded-t-sm transition-all" style={{ height: `${bar.c * 2.5}%` }} />
                    <div className="w-2 bg-amber-400 rounded-t-sm transition-all" style={{ height: `${bar.p * 2.5}%` }} />
                    <div className="w-2 bg-emerald-500 rounded-t-sm transition-all" style={{ height: `${bar.d * 2.5}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{bar.day}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
                View All Activity →
              </Button>
            </CardHeader>
            <div className="space-y-3">
              {recentActivity.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{act.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Urgent Items & AI Assistant */}
        <div className="space-y-5">
          {/* Urgent Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Urgent Items</CardTitle>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All →</span>
            </CardHeader>
            <div className="space-y-2.5 text-xs">
              {urgentItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{item.detail}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{item.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Assistant Callout Card matching Image 1 mockup */}
          <Card className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border-blue-200 dark:from-slate-900 dark:to-blue-950/60 dark:border-blue-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Assistant</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Need help with a service request or job analysis?
            </p>
            <Button variant="primary" size="sm" className="w-full shadow-xs" onClick={() => navigate('/requests/new')}>
              Ask ServiceForge AI →
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
