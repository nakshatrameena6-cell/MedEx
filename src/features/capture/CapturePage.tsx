import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Language, CaptureResponse, CaptureConfirmResponse } from '../../types/api';
import { VoiceCapture } from './VoiceCapture';
import { PhotoCapture } from './PhotoCapture';
import { CaptureReview } from './CaptureReview';
import { CaptureStatus } from './CaptureStatus';
import {
  Camera,
  Mic,
  Clock,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ShieldCheck,
  Store,
  ArrowLeft,
  Pill,
} from 'lucide-react';

const FACILITIES = [
  { id: 'TN-PHC-014', name: 'PHC Sample-014 (Block-A)', status: 'RED' },
  { id: 'TN-PHC-021', name: 'PHC Sample-021 (Block-B)', status: 'AMBER' },
  { id: 'TN-PHC-042', name: 'PHC Sample-042 (Block-B)', status: 'GREEN' },
  { id: 'TN-CHC-003', name: 'CHC Sample-003 (Block-A)', status: 'GREEN' },
];

export const CapturePage: React.FC = () => {
  const navigate = useNavigate();
  const { role, district, user, isMockMode } = useAuthRole();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [facilityId, setFacilityId] = useState<string>('TN-PHC-014');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en-IN');
  const [activeTab, setActiveTab] = useState<'scan' | 'voice'>('scan');

  const [captureResponse, setCaptureResponse] = useState<CaptureResponse | null>(null);
  const [confirmResponse, setConfirmResponse] = useState<CaptureConfirmResponse | null>(null);

  const isAuditor = role === 'AUDITOR';

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }
    return headers;
  };

  const handleReset = useCallback(() => {
    setCaptureResponse(null);
    setConfirmResponse(null);
  }, []);

  return (
    <div className="space-y-4 text-left font-sans select-none max-w-[1440px] mx-auto">
      {/* =========================================================================
          TOP NAVBAR: MedScan Brand, Subtitle, Status & Profile
          ========================================================================= */}
      <header className="p-3.5 px-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
            <Pill className="w-5 h-5 -rotate-45" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-white tracking-tight">MedEx Stock Capture</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-xs font-mono text-slate-400">
              Easy Register Scanner
            </span>
          </div>
        </div>

        {/* Right: Facility Picker, Online Status, Settings & Avatar */}
        <div className="flex items-center gap-3">
          {/* Facility Context Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs">
            <Store className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <select
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                handleReset();
              }}
              disabled={isAuditor}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              {FACILITIES.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  {f.id} ({f.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Online Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-teal-300 font-mono shadow"
            title={user}
          >
            MC
          </div>
        </div>
      </header>

      {/* =========================================================================
          WORKSPACE BODY: Left Sidebar + Center Stage
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Sub-Navigation Sidebar (2 Cols) */}
        <nav className="lg:col-span-2 space-y-4">
          <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('scan');
                handleReset();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'scan' && !captureResponse && !confirmResponse
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Scan Register</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('voice');
                handleReset();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === 'voice' && !captureResponse && !confirmResponse
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>Voice Note</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/audit')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>History</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/risk')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Stock Watch</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/forecast')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Forecast</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </div>

          {/* Bottom Trust Badge Card */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-2 hidden lg:block">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Fast, Simple & Local</div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Scan or speak to update medicine stock in seconds.
            </p>
          </div>
        </nav>

        {/* Center Main Stage (10 Cols) */}
        <main className="lg:col-span-10">
          <AnimatePresence mode="wait">
            {confirmResponse ? (
              <motion.div
                key="status"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-base font-bold text-white">Stock Updated Successfully</h3>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Record More Stock</span>
                  </button>
                </div>
                <CaptureStatus
                  confirmResponse={confirmResponse}
                  onReset={handleReset}
                  onGoToMap={() => navigate(`/map?facility_id=${facilityId}`)}
                />
              </motion.div>
            ) : captureResponse ? (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Review Scanned Stock</h3>
                    <p className="text-xs text-slate-400">
                      Check and adjust medicine quantities before saving to district records
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Scanner</span>
                  </button>
                </div>

                <CaptureReview
                  captureData={captureResponse}
                  onConfirmSuccess={(res) => setConfirmResponse(res)}
                  headers={getAuthHeaders()}
                  disabled={isAuditor || !isOnline}
                />
              </motion.div>
            ) : activeTab === 'scan' ? (
              <motion.div
                key="photo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PhotoCapture
                  facilityId={facilityId}
                  onCaptureSuccess={(res) => setCaptureResponse(res)}
                  headers={getAuthHeaders()}
                  disabled={isAuditor || !isOnline}
                />
              </motion.div>
            ) : (
              <motion.div
                key="voice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-base font-bold text-white">Voice Stock Recording</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('scan')}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Switch to Camera Scanner</span>
                  </button>
                </div>
                <VoiceCapture
                  facilityId={facilityId}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  onCaptureSuccess={(res) => setCaptureResponse(res)}
                  headers={getAuthHeaders()}
                  disabled={isAuditor || !isOnline}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
