import React, { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { attachmentService } from '../../services/attachmentService';
import { AttachmentPreviewCard } from './AttachmentPreviewCard';
import { CameraModal } from './CameraModal';

export function EvidenceUploader({ attachments = [], onAttachmentsChange }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [validationError, setValidationError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const processFiles = (fileList) => {
    setValidationError('');
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const newAttachments = [];
    let errorMsg = '';

    for (const file of filesArray) {
      const currentTotal = attachments.length + newAttachments.length;
      const validation = attachmentService.validateFile(file, currentTotal);

      if (!validation.valid) {
        errorMsg = validation.error;
        break;
      }

      const attachmentModel = attachmentService.createAttachmentModel(file, validation.type);
      newAttachments.push(attachmentModel);
    }

    if (errorMsg) {
      setValidationError(errorMsg);
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handlePhotoCaptured = (photoFile) => {
    processFiles([photoFile]);
  };

  const handleRemove = (id) => {
    const itemToRemove = attachments.find(a => a.id === id);
    if (itemToRemove) {
      attachmentService.revokeAttachmentPreview(itemToRemove);
    }
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const handleTakePhotoClick = () => {
    setIsCameraOpen(true);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,text/plain,text/csv"
        className="hidden"
        aria-label="Upload evidence files input"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take photo camera capture input"
      />

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        onFallbackFilePicker={() => cameraInputRef.current?.click()}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <span>📷</span> Add Evidence & Supporting Files
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Attach site photos, equipment nameplates, or diagnostic PDFs (Max 15 MB per file, 10 files limit).
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            size="sm" 
            onClick={handleTakePhotoClick}
            aria-label="Take Photo using device camera"
          >
            📷 Take Photo
          </Button>
          <Button 
            type="button" 
            variant="primary" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload evidence image or document files"
          >
            📎 Upload Files
          </Button>
        </div>
      </div>

      {/* Validation Error Notice */}
      {validationError && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>⚠ {validationError}</span>
          <button 
            type="button"
            onClick={() => setValidationError('')} 
            className="text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachments Preview Grid / Dropzone Empty State */}
      {attachments.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="py-8 px-4 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/60 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-colors cursor-pointer group space-y-2"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 flex items-center justify-center text-xl mx-auto transition-colors">
            📷
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Add photos or supporting files
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Take a photo or upload diagnostic evidence
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
          {attachments.map((att) => (
            <AttachmentPreviewCard 
              key={att.id} 
              attachment={att} 
              onRemove={handleRemove} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

