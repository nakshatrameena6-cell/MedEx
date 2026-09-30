import React, { useState, useRef, useEffect } from 'react';
import { Language, CaptureResponse } from '../../types/api';
import { captureVoice } from '../../services/captureService';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';

interface VoiceCaptureProps {
  facilityId: string;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onCaptureSuccess: (res: CaptureResponse) => void;
  headers: Record<string, string>;
  disabled?: boolean;
}

export const VoiceCapture: React.FC<VoiceCaptureProps> = ({
  facilityId,
  selectedLanguage,
  onLanguageChange,
  onCaptureSuccess,
  headers,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);

    if (disabled) {
      setErrorMessage('Offline: Voice recording submission is disabled.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop stream tracks cleanly
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleAudioSubmit(audioBlob);
      };

      recorder.start(200); // Collect data every 200ms
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission denied. Please allow microphone access in browser settings.');
      } else {
        setErrorMessage('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await captureVoice(
        {
          audio: audioBlob,
          facility_id: facilityId,
          language: selectedLanguage,
        },
        headers
      );
      onCaptureSuccess(response);
    } catch (err: any) {
      console.error('Voice submission error:', err);
      if (err.status === 413) {
        setErrorMessage('Audio file is too large (>10 MB). Please record a shorter update.');
      } else {
        setErrorMessage(err.message || 'Failed to process voice capture.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-medex-surface/40 border border-medex-border rounded-xl text-center space-y-6">
      {/* Language Selector */}
      <div className="flex flex-col items-center space-y-2">
        <label className="text-2xs font-mono text-medex-muted uppercase tracking-wider">
          Capture Language
        </label>
        <div className="inline-flex rounded-lg bg-medex-sidebar border border-medex-border p-1 gap-1">
          <button
            type="button"
            onClick={() => onLanguageChange('en-IN')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedLanguage === 'en-IN'
                ? 'bg-medex-cyan text-medex-bg shadow-sm'
                : 'text-medex-secondary hover:text-medex-primary'
            }`}
          >
            English (en-IN)
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ta-IN')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedLanguage === 'ta-IN'
                ? 'bg-medex-cyan text-medex-bg shadow-sm'
                : 'text-medex-secondary hover:text-medex-primary'
            }`}
          >
            தமிழ் (ta-IN)
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('hi-IN')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedLanguage === 'hi-IN'
                ? 'bg-medex-cyan text-medex-bg shadow-sm'
                : 'text-medex-secondary hover:text-medex-primary'
            }`}
          >
            हिन्दी (hi-IN)
          </button>
        </div>
      </div>

      {/* Main Touch-Friendly Big Microphone Button */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-medex-red/20 animate-ping pointer-events-none" />
        )}

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || disabled}
          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-lg border-2 ${
            isRecording
              ? 'bg-medex-red text-white border-medex-red-light hover:bg-red-600 scale-105'
              : isProcessing
              ? 'bg-medex-surface text-medex-cyan border-medex-cyan/50 cursor-wait'
              : disabled
              ? 'bg-medex-surface text-medex-muted border-medex-border opacity-50 cursor-not-allowed'
              : 'bg-medex-cyan/15 text-medex-cyan border-medex-cyan/40 hover:bg-medex-cyan/25 hover:scale-105'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : isRecording ? (
            <Square className="w-9 h-9 fill-current" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
          
          <span className="text-2xs font-bold font-mono mt-1 uppercase tracking-wider">
            {isProcessing ? 'Processing' : isRecording ? 'Stop' : 'Record'}
          </span>
        </button>

        {isRecording && (
          <div className="mt-3 px-3 py-1 rounded-full bg-medex-red/15 border border-medex-red/30 text-medex-red-light font-mono text-xs font-bold animate-pulse">
            RECORDING: {recordingTime}s
          </div>
        )}
      </div>

      <p className="text-xs text-medex-secondary max-w-sm">
        {isProcessing
          ? 'Processing capture with Speech-to-Text & Gemini AI drug extraction...'
          : isRecording
          ? 'Speak medicine names and quantities clearly (e.g., "ORS 120 packets, Paracetamol 500 tablets 800"). Tap Stop when finished.'
          : 'Tap the big microphone button to record stock update.'}
      </p>

      {errorMessage && (
        <div className="p-3 bg-medex-red/15 border border-medex-red/30 rounded-lg text-xs text-medex-red-light flex items-center gap-2 max-w-md text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
