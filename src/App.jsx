import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-cyan-500 selection:text-slate-950">
      <div className="max-w-2xl w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          AWS Builder Center — Zero to Shipped Hackathon
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          ServiceForge AI
        </h1>

        <p className="text-slate-400 text-base leading-relaxed">
          Frontend project foundation successfully initialized with React, Vite, and Tailwind CSS v4. Ready for architecture implementation.
        </p>

        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-medium text-slate-400">
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <span className="block text-slate-200 font-bold text-sm mb-1">React 18</span>
            Modern Frontend Engine
          </div>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <span className="block text-slate-200 font-bold text-sm mb-1">Vite</span>
            Lightning Build Tooling
          </div>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <span className="block text-slate-200 font-bold text-sm mb-1">Tailwind CSS v4</span>
            Vite Plugin Integration
          </div>
        </div>
      </div>
    </div>
  )
}
