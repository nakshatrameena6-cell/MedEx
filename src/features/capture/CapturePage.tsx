import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Language, CaptureResponse, CaptureConfirmResponse } from '../../types/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { OfflineBadge } from '../../components/common/OfflineBadge';
import { Button } from '../../components/common/Button';
import { Card3D } from '../../components/3d/Card3D';
import { VoiceCapture } from './VoiceCapture';
import { PhotoCapture } from './PhotoCapture';
import { CaptureReview } from './CaptureReview';
import { CaptureStatus } from './CaptureStatus';
import { COPY } from '../../constants/copy';
import { Mic, Camera, ShieldAlert, Store, ArrowLeft, Radio } from 'lucide-react';

export const CapturePage: React.FC = () => {
  const navigate = useNavigate();
  const { role, district, user, isMockMode } = useAuthRole();

  // Browser Network Online / Offline Status
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

  // Facility Context Selection
  const [facilityId, setFacilityId] = useState<string>('TN-PHC-014');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en-IN');

  // Mode: 'voice' | 'photo'
  const [activeTab, setActiveTab] = useState<'voice' | 'photo'>('voice');

  // Workflow State
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

  const handleReset = () => {
    setCaptureResponse(null);
    setConfirmResponse(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 text-left font-sans"
    >
      <PageHeader
        title={COPY.headers.phcCaptureTitle}
        subtitle={COPY.headers.phcCaptureSubtitle}
        badge={
          <div className="flex items-center gap-2">
            <OfflineBadge />
            <StatusBadge status="CYAN" label="POST /capture" />
          </div>
        }
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'Capture Workflows' }]}
      />

      {/* Role & Scope Warning for AUDITOR */}
      {isAuditor && (
        <div className="p-4 bg-theme-warning-bg/40 border border-theme-warning-text/40 rounded-2xl text-xs text-theme-warning-text flex items-center gap-3 font-mono backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 shrink-0 text-theme-warning" />
          <div>
            <span className="font-bold block">AUDITOR ROLE READ-ONLY NOTICE:</span>
            The AUDITOR role is restricted to read-only access. Stock entry capture submissions (POST /capture) are disabled.
          </div>
        </div>
      )}

      {/* Facility Context & Tab Switcher Bar */}
      <Card3D 
        maxTilt={2}
        specularColor="rgba(56, 189, 248, 0.12)"
        className="p-5 bg-theme-surface/85 backdrop-blur-xl border border-theme-border rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-theme-primary/10 text-theme-primary border border-theme-primary/25 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="w-full">
            <label className="text-[10px] font-mono text-theme-muted uppercase tracking-wider block">
              ACTIVE FRONTLINE NODE
            </label>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  handleReset();
                }}
                disabled={isAuditor}
                className="min-h-[44px] bg-theme-bg/90 border border-theme-border-control rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-theme-text focus:outline-none focus:border-theme-primary transition-all"
              >
                <option value="TN-PHC-014">TN-PHC-014 (PHC Sample-014 · Block-A)</option>
                <option value="TN-PHC-021">TN-PHC-021 (PHC Sample-021 · Block-B)</option>
                <option value="TN-PHC-042">TN-PHC-042 (PHC Sample-042 · Block-B)</option>
                <option value="TN-CHC-003">TN-CHC-003 (CHC Sample-003 · Block-A)</option>
              </select>

              <span className="text-[11px] font-mono text-theme-muted bg-white/5 px-3 py-2 rounded-xl border border-theme-border">
                DISTRICT: {district}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Voice vs Photo with Framer Motion layoutId */}
        {!captureResponse && !confirmResponse && (
          <div
            role="tablist"
            aria-label="Capture Mode"
            className="flex items-center justify-center rounded-xl bg-black/30 border border-theme-border p-1.5 gap-1.5 w-full md:w-auto backdrop-blur-md"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'voice'}
              onClick={() => setActiveTab('voice')}
              className={`relative min-h-[44px] px-5 py-2 rounded-lg text-xs font-semibold flex-1 md:flex-initial inline-flex items-center justify-center gap-2 transition-all z-10 ${
                activeTab === 'voice'
                  ? 'text-white font-bold'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              {activeTab === 'voice' && (
                <motion.div
                  layoutId="activeCaptureTab"
                  className="absolute inset-0 bg-theme-primary rounded-lg shadow-lg shadow-theme-primary/30 z-[-1]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Mic className="w-4 h-4" />
              <span>Voice Entry</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'photo'}
              onClick={() => setActiveTab('photo')}
              className={`relative min-h-[44px] px-5 py-2 rounded-lg text-xs font-semibold flex-1 md:flex-initial inline-flex items-center justify-center gap-2 transition-all z-10 ${
                activeTab === 'photo'
                  ? 'text-white font-bold'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              {activeTab === 'photo' && (
                <motion.div
                  layoutId="activeCaptureTab"
                  className="absolute inset-0 bg-theme-primary rounded-lg shadow-lg shadow-theme-primary/30 z-[-1]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Camera className="w-4 h-4" />
              <span>Photo Register</span>
            </button>
          </div>
        )}
      </Card3D>

      {/* Main Interactive Stage Container */}
      <Card3D 
        maxTilt={1.5}
        specularColor="rgba(56, 189, 248, 0.08)"
        className="bg-theme-surface/85 backdrop-blur-xl border border-theme-border rounded-2xl p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-theme-primary/10 border border-theme-primary/25 flex items-center justify-center text-theme-primary">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-theme-text">
                {confirmResponse
                  ? 'Stock Update Confirmed'
                  : captureResponse
                  ? 'Review & Confirm Extracted Stock Rows'
                  : activeTab === 'voice'
                  ? 'Voice Stock Capture'
                  : 'Photo Register Capture'}
              </h2>
              <p className="text-[11px] font-mono text-theme-muted">
                {confirmResponse
                  ? 'RECOMPUTED FACILITY RESILIENCE SCORE // BROADCAST TO COMMAND MAP'
                  : captureResponse
                  ? 'EDIT LOW-CONFIDENCE ROWS BEFORE SAVING SNAPSHOT'
                  : activeTab === 'voice'
                  ? 'MULTILINGUAL AUDIO PIPELINE // THREE.JS 3D FREQUENCY SPECTRUM'
                  : 'MULTIMODAL REGISTER OCR & DRUG MATCHING'}
              </p>
            </div>
          </div>

          {(captureResponse || confirmResponse) && (
            <Button variant="secondary" size="sm" onClick={handleReset} className="min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>New Capture</span>
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {confirmResponse ? (
            <motion.div
              key="status"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
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
            >
              <CaptureReview
                captureData={captureResponse}
                onConfirmSuccess={(res) => setConfirmResponse(res)}
                headers={getAuthHeaders()}
                disabled={isAuditor || !isOnline}
              />
            </motion.div>
          ) : activeTab === 'voice' ? (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <VoiceCapture
                facilityId={facilityId}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                onCaptureSuccess={(res) => setCaptureResponse(res)}
                headers={getAuthHeaders()}
                disabled={isAuditor || !isOnline}
              />
            </motion.div>
          ) : (
            <motion.div
              key="photo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PhotoCapture
                facilityId={facilityId}
                onCaptureSuccess={(res) => setCaptureResponse(res)}
                headers={getAuthHeaders()}
                disabled={isAuditor || !isOnline}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card3D>
    </motion.div>
  );
};


