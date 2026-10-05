import React from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/AuthContext';
import { useServiceRequests } from '../hooks/useServiceRequests';
import { useServiceJobs } from '../hooks/useServiceJobs';

export function DashboardPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const { requests, isLoading: reqLoading } = useServiceRequests();
  const { jobs, isLoading: jobLoading } = useServiceJobs();

  const loading = reqLoading || jobLoading;

  // Derive first name from live authenticated user
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'User';

  const openRequestsCount = requests.filter(r => ['new', 'open', 'under review', 'ai ready'].includes((r.status || '').toLowerCase())).length;
  const inProgressJobsCount = jobs.filter(j => ['in_progress', 'assigned', 'in progress'].includes((j.status || '').toLowerCase())).length;
  const pendingApprovalCount = requests.filter(r => ['pending', 'ai ready', 'new'].includes((r.status || '').toLowerCase())).length;
  const completedTodayCount = requests.filter(r => ['completed'].includes((r.status || '').toLowerCase())).length + jobs.filter(j => ['completed'].includes((j.status || '').toLowerCase())).length;

  const urgentItems = requests
    .filter(r => ['critical', 'high'].includes((r.priority || '').toLowerCase()))
    .map(r => ({
      title: `${r.priority} Priority Request`,
      detail: `${r.ticketNumber || r.requestId} — ${r.assetName || r.customerName || 'Service Request'}`,
      time: new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: (r.priority || '').toUpperCase() === 'CRITICAL' ? '🔴' : '🟠'
    }));

  const recentActivity = [
    ...requests.map(r => ({
      text: `Service request ${r.ticketNumber || r.requestId} (${r.status})`,
      time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      rawTime: new Date(r.createdAt || 0).getTime()
    })),
    ...jobs.map(j => ({
      text: `Service job ${j.jobIdNumber || j.jobId} (${j.status})`,
      time: j.updatedAt ? new Date(j.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      rawTime: new Date(j.updatedAt || 0).getTime()
    }))
  ].sort((a, b) => b.rawTime - a.rawTime).slice(0, 5);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Good morning, {firstName}! <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your service operations today.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl shadow-2xs">
          {formattedDate}
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
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
            Live queue
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
            Active field jobs
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
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              ✓
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{completedTodayCount}</div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Archived completion
          </div>
        </Card>
      </div>

      {/* Operations Grid: Overview & Recent Activity | Urgent Items & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Service Jobs Overview Chart Graphic Card */}
          <Card>
            <CardHeader>
              <CardTitle>Service Jobs Activity</CardTitle>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> Requests ({requests.length})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Jobs ({jobs.length})</span>
              </div>
            </CardHeader>
            <div className="p-6 text-center space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Active Tenant Queue Summary
              </div>
              <div className="flex justify-center items-center gap-6 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left min-w-[120px]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Requests</span>
                  <span className="text-xl font-black text-blue-600">{requests.length} total</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left min-w-[120px]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Jobs</span>
                  <span className="text-xl font-black text-emerald-600">{jobs.length} total</span>
                </div>
              </div>
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
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No recent activity logged in this organization.
              </div>
            ) : (
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
            )}
          </Card>
        </div>

        {/* Right Column: Urgent Items & AI Assistant */}
        <div className="space-y-5">
          {/* Urgent Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Urgent Items ({urgentItems.length})</CardTitle>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer" onClick={() => navigate('/requests')}>View All →</span>
            </CardHeader>
            {urgentItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Zero urgent or critical items pending.
              </div>
            ) : (
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
            )}
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
