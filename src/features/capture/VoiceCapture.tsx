import React, { useState, useRef, useEffect } from 'react';
import { Language, CaptureResponse } from '../../types/api';
import { captureVoice } from '../../services/captureService';
import { Mic, Square, Loader2, AlertCircle, Keyboard, Sparkles } from 'lucide-react';
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

const PRESETS = [
  {
    id: 'p1',
    label: '⚡ 250 ORS + 400 Paracetamol',
    transcript:
      'Emergency intake: received 250 ORS 50g sachets and 400 Paracetamol 500mg tablets, batch B-9014, expiry March 2027.',
    rows: [
      {
        row_id: 1,
        drug_heard: '250 ORS 50g sachets',
        drug_code: 'ORS',
        drug_name: 'Oral Rehydration Salts',
        qty: 250,
        unit: 'sachets',
        batch_no: 'B-9014',
        expiry_date: '2027-03-31',
        confidence: 0.98,
        needs_confirm: false,
      },
      {
        row_id: 2,
        drug_heard: '400 Paracetamol 500mg tablets',
        drug_code: 'PARA500',
        drug_name: 'Paracetamol 500 mg',
        qty: 400,
        unit: 'tablets',
        batch_no: 'B-9014',
        expiry_date: '2027-03-31',
        confidence: 0.95,
        needs_confirm: false,
      },
    ],
  },
  {
    id: 'p2',
    label: '💊 150 Amoxicillin + 80 Zinc',
    transcript:
      'Pediatric intake: 150 Amoxicillin 500mg capsules and 80 Zinc 20mg tablets, batch Z-332, expiry August 2026.',
    rows: [
      {
        row_id: 1,
        drug_heard: '150 Amoxicillin 500mg capsules',
        drug_code: 'AMOX500',
        drug_name: 'Amoxicillin 500mg',
        qty: 150,
        unit: 'capsules',
        batch_no: 'Z-332',
        expiry_date: '2026-08-31',
        confidence: 0.96,
        needs_confirm: false,
      },
      {
        row_id: 2,
        drug_heard: '80 Zinc 20mg tablets',
        drug_code: 'ZINC',
        drug_name: 'Zinc Tablets 20mg',
        qty: 80,
        unit: 'tablets',
        batch_no: 'Z-332',
        expiry_date: '2026-08-31',
        confidence: 0.92,
        needs_confirm: false,
      },
    ],
  },
  {
    id: 'p3',
    label: '📦 300 Iron Folic Acid',
    transcript:
      'Maternal health intake: 300 Iron Folic Acid tablets, batch IFA-881, expiry November 2026.',
    rows: [
      {
        row_id: 1,
        drug_heard: '300 Iron Folic Acid tablets',
        drug_code: 'IFA',
        drug_name: 'Iron Folic Acid',
        qty: 300,
        unit: 'tablets',
        batch_no: 'IFA-881',
        expiry_date: '2026-11-30',
        confidence: 0.94,
        needs_confirm: false,
      },
    ],
  },
];

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
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'en-IN' || saved === 'ta-IN' || saved === 'hi-IN')) {
        onLanguageChange(saved);
      }
    } catch (e) {}
  }, [onLanguageChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    onLanguageChange(lang);
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setLiveTranscript('');

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
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleAudioSubmit(audioBlob);
      };

      recorder.start(200);
      setState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setState('error');
      setErrorMessage(
        'Microphone permission denied. You can click any example button below to test instantly!'
      );
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
      setState('error');
      setErrorMessage(err.message || 'Failed to process voice capture.');
    }
  };

  const handleTriggerPreset = (preset: (typeof PRESETS)[0]) => {
    setState('recording');
    setRecordingTime(0);
    setLiveTranscript('');
    setErrorMessage(null);

    const words = preset.transcript.split(' ');
    let idx = 0;

    simTimerRef.current = setInterval(() => {
      if (idx < words.length) {
        setLiveTranscript(words.slice(0, idx + 1).join(' '));
        idx += 2;
      } else {
        clearInterval(simTimerRef.current);
        setState('processing');

        setTimeout(() => {
          setState('idle');
          const response: CaptureResponse = {
            capture_id: `CAP-${Date.now().toString().slice(-6)}`,
            facility_id: facilityId,
            source: 'voice',
            language: selectedLanguage,
            transcript: preset.transcript,
            confidence_threshold: 0.85,
            rows: preset.rows,
            warnings: [],
          };
          onCaptureSuccess(response);
        }, 800);
      }
    }, 100);
  };

  const handleManualFallback = () => {
    const fallbackResponse: CaptureResponse = {
      capture_id: `CAP-TYPED-${Date.now().toString().slice(-6)}`,
      facility_id: facilityId,
      source: 'voice',
      language: selectedLanguage,
      transcript: 'Direct manual stock entry',
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
          expiry_date: '2027-08-31',
          confidence: 0.95,
          needs_confirm: false,
        },
      ],
      warnings: [],
    };
    onCaptureSuccess(fallbackResponse);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 text-center select-none max-w-xl mx-auto py-2">
      {/* Language Selector */}
      <div className="flex items-center justify-center gap-2">
        {[
          { id: 'en-IN' as Language, label: 'English' },
          { id: 'ta-IN' as Language, label: 'தமிழ்' },
          { id: 'hi-IN' as Language, label: 'हिन्दी' },
        ].map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => handleLanguageSelect(lang.id)}
            disabled={state === 'recording' || state === 'processing'}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedLanguage === lang.id
                ? 'bg-theme-primary text-white shadow-sm font-semibold'
                : 'bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Main Microphone Button */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="relative">
          {state === 'idle' || state === 'error' ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="w-24 h-24 rounded-full bg-theme-primary hover:bg-theme-primary/90 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Start recording"
            >
              <Mic className="w-10 h-10" />
            </button>
          ) : state === 'requesting_permission' ? (
            <div className="w-24 h-24 rounded-full bg-theme-surface border-2 border-theme-primary flex items-center justify-center text-theme-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : state === 'recording' ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Stop recording"
            >
              <Square className="w-8 h-8 fill-current" />
            </button>
          ) : (
            <div className="w-24 h-24 rounded-full bg-theme-surface border-2 border-theme-primary flex items-center justify-center text-theme-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Status Text & Timer */}
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-theme-text">
            {state === 'idle'
              ? 'Tap to speak medicine stock'
              : state === 'requesting_permission'
              ? 'Connecting microphone...'
              : state === 'recording'
              ? `Listening... ${formatTimer(recordingTime)}`
              : 'Recognizing medicines...'}
          </p>
          <p className="text-xs text-theme-muted">
            {state === 'idle'
              ? 'Say medicine name and count (e.g. "Received 250 ORS sachets")'
              : state === 'recording'
              ? 'Tap the red square when you are finished'
              : 'Analyzing speech...'}
          </p>
        </div>
      </div>

      {/* 3D Waveform Visualizer */}
      <div className="h-16 w-full max-w-sm mx-auto opacity-75">
        <WaveformVisualizer3D
          isRecording={state === 'recording'}
          isProcessing={state === 'processing'}
          className="w-full h-full"
        />
      </div>

      {/* Live Transcript (Only visible when text exists) */}
      {liveTranscript && (
        <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text text-left font-mono">
          <div className="flex items-center gap-1.5 text-[11px] text-theme-muted mb-1">
            <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
            <span>What you said:</span>
          </div>
          <p>{liveTranscript}</p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Example Scenarios */}
      <div className="pt-2 border-t border-theme-border/60">
        <p className="text-xs text-theme-muted mb-2.5">Or try a sample voice note:</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleTriggerPreset(preset)}
              disabled={state === 'recording' || state === 'processing'}
              className="px-3 py-1.5 rounded-lg bg-theme-surface hover:bg-theme-border/50 border border-theme-border text-xs text-theme-text transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Type Link */}
      <div>
        <button
          type="button"
          onClick={handleManualFallback}
          className="text-xs text-theme-muted hover:text-theme-primary inline-flex items-center gap-1 transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Prefer typing? Click here to enter manually</span>
        </button>
      </div>
    </div>
  );
};
