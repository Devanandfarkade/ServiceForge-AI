import React from 'react';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const statusConfig = {
    'New': { variant: 'cyan', label: 'New Request' },
    'Analyzing': { variant: 'amber', label: 'AI Analyzing' },
    'AI Ready': { variant: 'purple', label: 'AI Ready' },
    'Assigned': { variant: 'cyan', label: 'Assigned' },
    'In Progress': { variant: 'emerald', label: 'In Progress' },
    'IN_PROGRESS': { variant: 'emerald', label: 'In Progress' },
    'ASSIGNED': { variant: 'cyan', label: 'Assigned' },
    'Completed': { variant: 'neutral', label: 'Completed' },
    'COMPLETED': { variant: 'neutral', label: 'Completed' },
    'Closed': { variant: 'neutral', label: 'Closed' }
  };

  const config = statusConfig[status] || { variant: 'neutral', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PriorityBadge({ priority }) {
  const priorityConfig = {
    'CRITICAL': { variant: 'rose', label: 'Critical' },
    'HIGH': { variant: 'amber', label: 'High Priority' },
    'High': { variant: 'amber', label: 'High Priority' },
    'MEDIUM': { variant: 'cyan', label: 'Medium' },
    'LOW': { variant: 'neutral', label: 'Low' }
  };

  const config = priorityConfig[priority] || { variant: 'neutral', label: priority };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
