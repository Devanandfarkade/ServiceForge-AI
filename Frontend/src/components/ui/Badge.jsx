import React from 'react';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cyan: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const statusConfig = {
    'New': { variant: 'blue', label: 'New' },
    'Under Review': { variant: 'amber', label: 'Under Review' },
    'AI Ready': { variant: 'purple', label: 'AI Ready' },
    'Assigned': { variant: 'blue', label: 'Assigned' },
    'ASSIGNED': { variant: 'blue', label: 'Assigned' },
    'In Progress': { variant: 'emerald', label: 'In Progress' },
    'IN_PROGRESS': { variant: 'emerald', label: 'In Progress' },
    'Converted to Job': { variant: 'emerald', label: 'Converted to Job' },
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
    'Critical': { variant: 'rose', label: 'Critical' },
    'HIGH': { variant: 'amber', label: 'High' },
    'High': { variant: 'amber', label: 'High' },
    'MEDIUM': { variant: 'blue', label: 'Medium' },
    'Medium': { variant: 'blue', label: 'Medium' },
    'LOW': { variant: 'neutral', label: 'Low' },
    'Low': { variant: 'neutral', label: 'Low' }
  };

  const config = priorityConfig[priority] || { variant: 'neutral', label: priority };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function AIStatusBadge({ status }) {
  const aiConfig = {
    'Not analyzed': { variant: 'neutral', label: 'Not Analyzed' },
    'Analyzed': { variant: 'purple', label: 'AI Analyzed' },
    'Needs review': { variant: 'amber', label: 'Needs Review' },
    'Approved': { variant: 'emerald', label: 'Approved' }
  };

  const config = aiConfig[status] || { variant: 'purple', label: status || 'AI Ready' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
