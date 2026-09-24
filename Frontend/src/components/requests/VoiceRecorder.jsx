import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { transcriptionService } from '../../services/transcriptionService';

export function VoiceRecorder({
  onTranscribed,
  onEdited,
  onTranscriptionComplete,
  onSourceChange,
  initialTranscript = '',
  initialText = '',
  onFallbackToTyped
}) {
  const defaultText = initialTranscript || initialText;

  // Voice states: 'IDLE' | 'RECORDING' | 'PROCESSING' | 'TRANSCRIBED' | 'EDITING' | 'ERROR'
  const [voiceState, setVoiceState] = useState(defaultText ? 'TRANSCRIBED' : 'IDLE');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState(defaultText);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasBeenEdited, setHasBeenEdited] = useState(false);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Clean up timer and audio tracks on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const notifyTranscribed = (text) => {
    if (onTranscribed) onTranscribed(text);
    if (onTranscriptionComplete) onTranscriptionComplete(text);
  };

  const notifyEdited = (text) => {
    if (onEdited) onEdited(text);
    if (onTranscriptionComplete) onTranscriptionComplete(text);
  };

  const notifySourceChange = (src) => {
    if (onSourceChange) onSourceChange(src);
  };

  const startRecording = async () => {
    setErrorMessage('');
    setRecordingSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording API not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setVoiceState('RECORDING');

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 120) {
            // Max 2 minutes
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access warning:', err);
      setErrorMessage(
        'Microphone access is required to record your voice note. Please allow microphone access or switch to typed input.'
      );
      setVoiceState('ERROR');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        await processAudioTranscription(audioBlob);
      };
      mediaRecorderRef.current.stop();
      setVoiceState('PROCESSING');
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      processAudioTranscription(null);
    }
  };

  const processAudioTranscription = async (audioBlob) => {
    setVoiceState('PROCESSING');
    try {
      const result = await transcriptionService.transcribeAudio(audioBlob);
      const text = result.transcript;
      setTranscript(text);
      setVoiceState('TRANSCRIBED');
      setHasBeenEdited(false);
      notifyTranscribed(text);
      notifySourceChange('voice');
    } catch (err) {
      setErrorMessage('Something went wrong while processing the recording. Please try again or switch to typed input.');
      setVoiceState('ERROR');
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setTranscript(val);
    if (!hasBeenEdited) {
      setHasBeenEdited(true);
      notifySourceChange('edited_voice');
    }
    notifyEdited(val);
  };

  const handleClear = () => {
    setTranscript('');
    setVoiceState('IDLE');
    setHasBeenEdited(false);
    notifyTranscribed('');
    notifySourceChange('typed');
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎙</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Voice Intake Dictation
          </span>
        </div>
        {(voiceState === 'TRANSCRIBED' || voiceState === 'EDITING') && (
          <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            ✓ Transcription Ready
          </span>
        )}
      </div>

      {/* STATE 1: IDLE */}
      {voiceState === 'IDLE' && (
        <div className="text-center py-6 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
          <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl mx-auto">
            🎙
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Speak to Describe the Equipment Issue
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Click start speaking, explain what is happening with the equipment, and review the automatic transcription before continuing.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={startRecording}
            aria-label="Start recording voice note"
          >
            🎙 Start Speaking
          </Button>
        </div>
      )}

      {/* STATE 2: RECORDING */}
      {voiceState === 'RECORDING' && (
        <div className="text-center py-6 space-y-4 border border-rose-200 dark:border-rose-500/30 rounded-xl bg-rose-50/50 dark:bg-rose-500/5">
          <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span>🔴 Recording...</span>
            <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/30 text-slate-900 dark:text-slate-100">
              {formatTimer(recordingSeconds)}
            </span>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={stopRecording}
              aria-label="Stop recording voice note"
            >
              ⏹ Stop Recording
            </Button>
          </div>
        </div>
      )}

      {/* STATE 3: PROCESSING */}
      {voiceState === 'PROCESSING' && (
        <div className="text-center py-8 space-y-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Converting your voice to text...
          </p>
          <p className="text-[10px] text-slate-500">
            Simulating Speech-to-Text conversion for user review...
          </p>
        </div>
      )}

      {/* STATE 4 & 5: TRANSCRIBED & EDITING */}
      {(voiceState === 'TRANSCRIBED' || voiceState === 'EDITING') && (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Review & Edit Voice Transcription:
          </label>
          <textarea
            rows={4}
            value={transcript}
            onChange={handleTextChange}
            onFocus={() => setVoiceState('EDITING')}
            placeholder="Edit transcription text..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none leading-relaxed"
            aria-label="Transcription review and edit textarea"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              ✓ You can edit this text directly before continuing.
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={startRecording}>
                🔄 Record Again
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClear}>
                🗑 Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 6: ERROR */}
      {voiceState === 'ERROR' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
            <span>⚠</span> {errorMessage}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={startRecording}>
              Try Recording Again
            </Button>
            {onFallbackToTyped && (
              <Button type="button" variant="ghost" size="sm" onClick={onFallbackToTyped}>
                Switch to Typed Input
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

