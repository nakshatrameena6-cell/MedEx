import React, { useState, useRef, useEffect } from 'react';
import { Language, CaptureResponse } from '../../types/api';
import { captureVoice } from '../../services/captureService';
import { Mic, Square, Loader2, AlertCircle, Keyboard, Radio } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { WaveformVisualizer3D } from '../../components/3d/WaveformVisualizer3D';

interface VoiceCaptureProps {
  facilityId: string;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onCaptureSuccess: (res: CaptureResponse) => void;
  headers: Record<string, string>;
  disabled?: boolean;
}

type VoiceState = 'idle' | 'requesting_permission' | 'recording' | 'processing' | 'error';

const STORAGE_KEY = 'medex_capture_lang';

export const VoiceCapture: React.FC<VoiceCaptureProps> = ({
  facilityId,
  selectedLanguage,
  onLanguageChange,
  onCaptureSuccess,
  headers,
  disabled = false,
}) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(12));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load language preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'en-IN' || saved === 'ta-IN' || saved === 'hi-IN')) {
        onLanguageChange(saved);
      }
    } catch (e) {
      console.warn('localStorage read failed', e);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAudioAnalyzer();
    };
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('localStorage write failed', e);
    }
    onLanguageChange(lang);
  };

  const startAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sampled: number[] = [];
        const step = Math.floor(dataArray.length / 16) || 1;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          const normalized = Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          sampled.push(normalized);
        }
        setAudioLevels(sampled);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (err) {
      console.warn('AudioContext visualization not available:', err);
    }
  };

  const stopAudioAnalyzer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevels(new Array(16).fill(12));
  };

  const startRecording = async () => {
    setErrorMessage(null);

    if (disabled) {
      setErrorMessage('Offline mode: Voice recording submission is disabled.');
      setState('error');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported in this browser.');
      setState('error');
      return;
    }

    setState('requesting_permission');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) {
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
        stream.getTracks().forEach((track) => track.stop());
        stopAudioAnalyzer();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleAudioSubmit(audioBlob);
      };

      recorder.start(200);
      startAudioAnalyzer(stream);
      setState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      stopAudioAnalyzer();
      setState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission denied. Please allow microphone access in browser settings.');
      } else {
        setErrorMessage('Could not access microphone: ' + (err.message || 'Device error'));
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
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    setState('processing');
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
      setState('idle');
      onCaptureSuccess(response);
    } catch (err: any) {
      console.error('Voice submission error:', err);
      setState('error');
      if (err.status === 413) {
        setErrorMessage('Audio file is too large (>10 MB). Please record a shorter update.');
      } else {
        setErrorMessage(err.message || 'Failed to process voice capture.');
      }
    }
  };

  const handleManualFallback = () => {
    const fallbackResponse: CaptureResponse = {
      capture_id: `CAP-TYPED-${Date.now().toString().slice(-6)}`,
      facility_id: facilityId,
      source: 'voice',
      language: selectedLanguage,
      transcript: 'Manual stock entry',
      confidence_threshold: 0.85,
      rows: [
        {
          row_id: 1,
          drug_heard: 'ORS 50g Sachets',
          drug_code: 'ORS',
          drug_name: 'Oral Rehydration Salts',
          qty: 120,
          unit: 'sachets',
          batch_no: 'B-1092',
          expiry_date: '2027-04-30',
          confidence: 1.0,
          needs_confirm: false,
        },
        {
          row_id: 2,
          drug_heard: 'Paracetamol 500mg',
          drug_code: 'PARA500',
          drug_name: 'Paracetamol 500 mg',
          qty: 800,
          unit: 'tablets',
          batch_no: '',
          expiry_date: '',
          confidence: 0.80,
          needs_confirm: true,
        },
      ],
      warnings: [],
    };
    onCaptureSuccess(fallbackResponse);
  };

  const formatMmSs = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-theme-surface/40 border border-theme-border rounded-xl text-center space-y-6 w-full max-w-xl mx-auto">
      {/* Keyboard-Accessible Segmented Control Language Selector */}
      <div className="flex flex-col items-center space-y-2 w-full">
        <label className="text-2xs font-mono text-theme-muted uppercase tracking-wider">
          Speech Language
        </label>
        <div
          role="radiogroup"
          aria-label="Capture Language"
          className="flex flex-wrap justify-center rounded-lg bg-theme-bg border border-theme-border p-1 gap-1 w-full max-w-md"
        >
          <button
            type="button"
            role="radio"
            aria-checked={selectedLanguage === 'en-IN'}
            onClick={() => handleLanguageSelect('en-IN')}
            className={`min-h-[44px] px-4 py-2 rounded-md text-xs font-semibold flex-1 transition-all ${
              selectedLanguage === 'en-IN'
                ? 'bg-theme-primary text-theme-bg shadow-sm font-bold'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            English (en-IN)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedLanguage === 'ta-IN'}
            onClick={() => handleLanguageSelect('ta-IN')}
            className={`min-h-[44px] px-4 py-2 rounded-md text-xs font-semibold flex-1 transition-all ${
              selectedLanguage === 'ta-IN'
                ? 'bg-theme-primary text-theme-bg shadow-sm font-bold'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            தமிழ் (ta-IN)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedLanguage === 'hi-IN'}
            onClick={() => handleLanguageSelect('hi-IN')}
            className={`min-h-[44px] px-4 py-2 rounded-md text-xs font-semibold flex-1 transition-all ${
              selectedLanguage === 'hi-IN'
                ? 'bg-theme-primary text-theme-bg shadow-sm font-bold'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            हिन्दी (hi-IN)
          </button>
        </div>
      </div>

      {/* Main Touch-Friendly Big Microphone Button (min 96px mobile, 120px desktop) */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        {state === 'recording' && (
          <>
            <div className="absolute inset-0 rounded-full bg-theme-critical/30 animate-ping pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border-2 border-theme-critical/40 animate-pulse pointer-events-none" />
          </>
        )}

        <button
          type="button"
          onClick={state === 'recording' ? stopRecording : startRecording}
          disabled={state === 'processing' || state === 'requesting_permission' || disabled}
          aria-label={state === 'recording' ? 'Stop Recording' : 'Start Voice Recording'}
          className={`w-[96px] h-[96px] sm:w-[120px] sm:h-[120px] min-w-[96px] min-h-[96px] rounded-full flex flex-col items-center justify-center transition-all shadow-xl border-2 ${
            state === 'recording'
              ? 'bg-theme-critical text-white border-red-400 scale-105'
              : state === 'processing' || state === 'requesting_permission'
              ? 'bg-theme-surface text-theme-primary border-theme-primary/50 cursor-wait'
              : disabled
              ? 'bg-theme-surface text-theme-muted border-theme-border opacity-50 cursor-not-allowed'
              : 'bg-theme-primary-tint text-theme-primary border-theme-primary/40 hover:scale-105 hover:bg-theme-primary/20'
          }`}
        >
          {state === 'processing' || state === 'requesting_permission' ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : state === 'recording' ? (
            <Square className="w-10 h-10 fill-current" />
          ) : (
            <Mic className="w-10 h-10" />
          )}

          <span className="text-2xs font-bold font-mono mt-1 uppercase tracking-wider">
            {state === 'requesting_permission'
              ? 'Permission'
              : state === 'processing'
              ? 'Extracting'
              : state === 'recording'
              ? 'Stop'
              : 'Record'}
          </span>
        </button>

        {/* Live Audio Analyser Waveform & mm:ss Timer */}
        {state === 'recording' && (
          <div className="mt-4 space-y-2 flex flex-col items-center">
            {/* Live Audio Waveform Bars */}
            <div className="flex items-end justify-center gap-1.5 h-10 px-4 py-1 bg-theme-bg/80 rounded-lg border border-theme-border">
              {audioLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  className="w-1.5 bg-theme-critical rounded-full transition-all duration-75"
                  style={{ height: `${lvl}%` }}
                />
              ))}
            </div>

            <div className="px-3 py-1 rounded-full bg-theme-critical-bg border border-theme-critical/40 text-theme-critical-text font-mono text-xs font-bold animate-pulse flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>Listening… {formatMmSs(recordingTime)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3D Real-time Audio Spectrum Landscape */}
      <WaveformVisualizer3D
        isRecording={state === 'recording'}
        isProcessing={state === 'processing'}
        className="w-full max-w-md shadow-xl"
      />

      {/* Processing State Message */}
      {state === 'processing' && (
        <div className="flex items-center justify-center gap-3 p-3 bg-theme-primary-tint/30 border border-theme-primary/40 rounded-lg text-xs font-mono text-theme-primary animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Extracting stock items…</span>
        </div>
      )}

      {/* Guidance Text */}
      <p className="text-xs text-theme-muted max-w-sm leading-relaxed">
        {state === 'processing'
          ? 'Processing audio with Speech-to-Text & Gemini AI drug extraction...'
          : state === 'recording'
          ? 'Speak medicine names and quantities clearly (e.g., "ORS 120 packets, Paracetamol 800 tablets"). Tap Stop when done.'
          : 'Tap the big microphone button to record stock updates.'}
      </p>

      {/* Error Message & Manual Entry Fallback */}
      {errorMessage && (
        <div className="space-y-3 w-full max-w-md">
          <div className="p-3 bg-theme-critical-bg border border-theme-critical/40 rounded-lg text-xs text-theme-critical-text flex items-center gap-2 text-left font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>

          <Button
            variant="secondary"
            onClick={handleManualFallback}
            className="w-full min-h-[44px]"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            <span>Enter Stock Manually (Typed Fallback)</span>
          </Button>
        </div>
      )}
    </div>
  );
};

