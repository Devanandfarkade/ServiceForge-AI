import React from 'react';

export function Input({ label, helperText, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 ${className}`}
        {...props}
      />
      {helperText && <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>}
      {error && <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
    </div>
  );
}

export function Textarea({ label, helperText, error, className = '', rows = 4, ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 ${className}`}
        {...props}
      />
      {helperText && <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>}
      {error && <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
    </div>
  );
}

export function Select({ label, helperText, error, options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-400 ${className}`}
        {...props}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>}
      {error && <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
    </div>
  );
}
