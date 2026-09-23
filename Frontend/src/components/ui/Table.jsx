import React from 'react';

export function Table({ headers, children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/60 shadow-xl ${className}`}>
      <table className="w-full text-left text-sm text-slate-300 border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3.5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
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
      className={`hover:bg-slate-800/40 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-sm ${className}`}>
      {children}
    </td>
  );
}
