import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Language, CaptureResponse, CaptureConfirmResponse } from '../../types/api';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { OfflineBadge } from '../../components/common/OfflineBadge';
import { VoiceCapture } from './VoiceCapture';
import { PhotoCapture } from './PhotoCapture';
import { CaptureReview } from './CaptureReview';
import { CaptureStatus } from './CaptureStatus';
import { Mic, Camera, ShieldAlert, Store } from 'lucide-react';

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
    <div className="space-y-6 text-left">
      <PageHeader
        title="PHC Stock Capture Workflow"
        subtitle="Frontline inventory recording via multilingual voice notes or register photos. Directly feeds the command center map."
        badge={
          <div className="flex items-center gap-2">
            <OfflineBadge />
            <StatusBadge status="CYAN" label="POST /capture" />
          </div>
        }
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Capture Workflows' },
        ]}
      />

      {/* Role & Scope Warning for AUDITOR */}
      {isAuditor && (
        <div className="p-4 bg-medex-amber/15 border border-medex-amber/40 rounded-xl text-xs text-medex-amber-light flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold font-mono block">AUDITOR ROLE READ-ONLY NOTICE:</span>
            The AUDITOR role is restricted to read-only access per contract specifications. Stock entry capture submissions (POST /capture) are disabled.
          </div>
        </div>
      )}

      {/* Facility & Context Selector Header */}
      <div className="medex-panel p-4 bg-medex-surface/60 border border-medex-border rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-medex-cyan/15 text-medex-cyan border border-medex-cyan/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <label className="text-2xs font-mono text-medex-muted uppercase block">
              Active Facility Context
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  handleReset();
                }}
                disabled={isAuditor}
                className="bg-medex-bg border border-medex-border rounded px-3 py-1 text-xs font-mono font-bold text-medex-primary focus:outline-none focus:border-medex-cyan"
              >
                <option value="TN-PHC-014">TN-PHC-014 (PHC Sample-014 · Block-A)</option>
                <option value="TN-PHC-021">TN-PHC-021 (PHC Sample-021 · Block-B)</option>
                <option value="TN-PHC-042">TN-PHC-042 (PHC Sample-042 · Block-B)</option>
                <option value="TN-CHC-003">TN-CHC-003 (CHC Sample-003 · Block-A)</option>
              </select>

              <span className="text-2xs font-mono text-medex-muted bg-medex-sidebar px-2 py-1 rounded border border-medex-border">
                District: {district}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Voice vs Photo */}
        {!captureResponse && !confirmResponse && (
          <div className="inline-flex rounded-lg bg-medex-sidebar border border-medex-border p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`px-4 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-all ${
                activeTab === 'voice'
                  ? 'bg-medex-cyan text-medex-bg shadow-sm'
                  : 'text-medex-secondary hover:text-medex-primary'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice Entry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`px-4 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-all ${
                activeTab === 'photo'
                  ? 'bg-medex-cyan text-medex-bg shadow-sm'
                  : 'text-medex-secondary hover:text-medex-primary'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Photo Register</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      <SectionCard
        title={
          confirmResponse
            ? 'Stock Update Confirmed'
            : captureResponse
            ? 'Review & Confirm Extracted Stock Rows'
            : activeTab === 'voice'
            ? 'Voice Stock Capture'
            : 'Photo Register Capture'
        }
        subtitle={
          confirmResponse
            ? 'Recomputed status available for map refetch'
            : captureResponse
            ? 'Edit low-confidence rows before saving snapshot'
            : activeTab === 'voice'
            ? 'Multilingual Speech-to-Text & Gemini JSON extraction (POST /capture/voice)'
            : 'Multimodal register parsing & drug matching (POST /capture/photo)'
        }
        actionSlot={
          (captureResponse || confirmResponse) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-2xs font-mono text-medex-cyan hover:underline font-semibold"
            >
              ← Cancel & New Capture
            </button>
          )
        }
      >
        {confirmResponse ? (
          <CaptureStatus
            confirmResponse={confirmResponse}
            onReset={handleReset}
            onGoToMap={() => navigate(`/map?facility_id=${facilityId}`)}
          />
        ) : captureResponse ? (
          <CaptureReview
            captureData={captureResponse}
            onConfirmSuccess={(res) => setConfirmResponse(res)}
            headers={getAuthHeaders()}
            disabled={isAuditor || !isOnline}
          />
        ) : activeTab === 'voice' ? (
          <VoiceCapture
            facilityId={facilityId}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            onCaptureSuccess={(res) => setCaptureResponse(res)}
            headers={getAuthHeaders()}
            disabled={isAuditor || !isOnline}
          />
        ) : (
          <PhotoCapture
            facilityId={facilityId}
            onCaptureSuccess={(res) => setCaptureResponse(res)}
            headers={getAuthHeaders()}
            disabled={isAuditor || !isOnline}
          />
        )}
      </SectionCard>
    </div>
  );
};
