import React from 'react';

export function Table({ headers, children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/70 ${className}`}>
      <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300 border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold select-none">
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3.5 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr 
      onClick={onClick} 
      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-xs text-slate-800 dark:text-slate-300 align-middle ${className}`}>
      {children}
    </td>
  );
}
