import React from 'react';

export function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-xs dark:bg-slate-900/60 dark:border-slate-800 mb-6">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;

        return (
          <React.Fragment key={step.id || idx}>
            <div 
              onClick={() => isCompleted && onStepClick && onStepClick(stepNum)}
              className={`flex items-center gap-3 flex-1 ${
                isCompleted && onStepClick ? 'cursor-pointer' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-bold truncate ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCompleted
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {step.title}
                </span>
                {step.subtitle && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline font-medium">
                    {step.subtitle}
                  </span>
                )}
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
