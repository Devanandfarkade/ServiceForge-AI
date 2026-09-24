import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';

export function CameraModal({ isOpen, onClose, onCapture, onFallbackFilePicker }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isOpen && !capturedDataUrl) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedDataUrl(null);
      setCapturedBlob(null);
      setCameraError('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsStarting(true);
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this environment');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access warning:', err);
      setCameraError('Microphone/Camera access required or camera device is unavailable.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedBlob(file);
        }
      },
      'image/jpeg',
      0.9
    );

    stopCamera();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
      onClose();
    }
  };

  const handleFallback = () => {
    onClose();
    if (onFallbackFilePicker) {
      onFallbackFilePicker();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="text-cyan-600 dark:text-cyan-400 text-base">📷</span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Take Equipment Photo
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Capture site equipment or damage using your device camera
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold px-2 py-1 rounded-md cursor-pointer"
            aria-label="Close Camera"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
          {capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Captured equipment photo preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-white text-xs gap-2">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Opening camera...</span>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center bg-slate-900/95 text-center text-rose-300 space-y-3">
                  <span className="text-3xl">📷</span>
                  <p className="text-xs font-semibold text-rose-300">{cameraError}</p>
                  <p className="text-[11px] text-slate-400">
                    If camera permission is blocked, you can select an existing photo file.
                  </p>
                  <Button type="button" variant="secondary" size="sm" onClick={handleFallback}>
                    📁 Select Photo File Instead
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for snapshot */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          {capturedDataUrl ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={handleRetake}>
                🔄 Retake Photo
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleUsePhoto}>
                ✓ Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCapture}
                disabled={!stream || isStarting || !!cameraError}
              >
                📸 Capture Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
