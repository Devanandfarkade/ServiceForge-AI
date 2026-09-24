import React from 'react';

export function InputModeToggle({ mode, onChange, onModeChange }) {
  const handleToggle = (newMode) => {
    if (onModeChange) onModeChange(newMode);
    if (onChange) onChange(newMode);
  };

  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
      <button
        type="button"
        onClick={() => handleToggle('type')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          mode === 'type'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        aria-label="Switch to typed text input mode"
      >
        <span>⌨</span>
        <span>Type Text</span>
      </button>

      <button
        type="button"
        onClick={() => handleToggle('voice')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          mode === 'voice'
            ? 'bg-cyan-600 text-white shadow-xs dark:bg-cyan-500'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        aria-label="Switch to voice note recording input mode"
      >
        <span>🎙</span>
        <span>Speak</span>
      </button>
    </div>
  );
}

