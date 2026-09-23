import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all duration-200 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-4 border-b border-slate-800/80 mb-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-slate-100 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}
