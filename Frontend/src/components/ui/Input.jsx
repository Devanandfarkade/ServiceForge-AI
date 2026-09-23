import React from 'react';

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</label>}
      <input
        className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', rows = 4, ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</label>}
      <textarea
        rows={rows}
        className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</label>}
      <select
        className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors ${className}`}
        {...props}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value} className="bg-slate-900 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
}
