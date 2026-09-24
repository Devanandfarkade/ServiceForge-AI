import React from 'react';

export function AttachmentPreviewCard({ attachment, onRemove }) {
  const isImage = attachment.type === 'image';

  return (
    <div className="relative group flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs transition-all hover:border-cyan-500/50 dark:hover:border-cyan-500/50 w-full">
      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-10 shadow-sm backdrop-blur-xs"
        title={`Remove attachment ${attachment.fileName}`}
        aria-label={`Remove attachment ${attachment.fileName}`}
      >
        ✕
      </button>

      {/* Visual Header / Thumbnail */}
      <div className="h-28 w-full rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden mb-2.5 border border-slate-200/80 dark:border-slate-800">
        {isImage && attachment.previewUrl ? (
          <img 
            src={attachment.previewUrl} 
            alt={attachment.fileName} 
            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="text-center space-y-1">
            <span className="text-3xl block">
              {attachment.contentType.includes('pdf') ? '📄' : '📝'}
            </span>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono block tracking-wider">
              {attachment.fileName.split('.').pop()}
            </span>
          </div>
        )}
      </div>

      {/* File Details */}
      <div className="space-y-1">
        <div 
          className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" 
          title={attachment.fileName}
        >
          {attachment.fileName}
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>{attachment.formattedSize}</span>
          <span className="capitalize text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
            {attachment.type}
          </span>
        </div>
      </div>
    </div>
  );
}

