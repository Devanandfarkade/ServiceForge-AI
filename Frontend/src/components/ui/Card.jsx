import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-slate-900 dark:bg-slate-900/80 dark:border-slate-800/90 dark:text-slate-100 transition-all duration-150 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-3.5 border-b border-slate-100 dark:border-slate-800/80 mb-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 ${className}`}>
      {children}
    </h3>
  );
}
