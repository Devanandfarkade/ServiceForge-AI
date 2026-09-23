import React from 'react';

export function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3 text-center ${className}`}>
      <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
      {label && <p className="text-xs font-medium text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
}

export function EmptyState({ title = 'No items found', description = 'There are no records to display.', action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 text-lg">
        🔍
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description = 'An error occurred while loading data.', onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center space-y-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg">
        ⚠️
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-rose-200">{title}</h3>
        <p className="text-xs text-rose-300/70">{description}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
