import React, { useState, useEffect, useRef } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Alert, Language } from '../../types/api';
import { listAlerts, getAlertAudioUrl } from '../../services/alertsService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FilterBar } from '../../components/common/FilterBar';
import { Select } from '../../components/common/Select';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Bell, Play, Pause, AlertTriangle, RefreshCw } from 'lucide-react';

export const AlertsPage: React.FC = () => {

  const { role, district, user, isMockMode } = useAuthRole();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en-IN');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('ALL');

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Audio Playback State
  const [playingAlertId, setPlayingAlertId] = useState<string | null>(null);
  const [audioErrorId, setAudioErrorId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAlerts = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    try {
      const data = await listAlerts(
        {
          district_id: district,
          language: selectedLanguage,
          acknowledged:
            acknowledgedFilter === 'TRUE' ? true : acknowledgedFilter === 'FALSE' ? false : undefined,
        },
        headers
      );
      setAlerts(data.items);
    } catch (err: any) {
      console.error('Failed to load alerts:', err);
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load multilingual alerts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [role, district, user, isMockMode, selectedLanguage, acknowledgedFilter]);

  const handleToggleAudio = (alert: Alert) => {
    if (!alert.audio_url) return;

    setAudioErrorId(null);

    if (playingAlertId === alert.alert_id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAlertId(null);
      return;
    }

    const audioUrl = getAlertAudioUrl(alert.alert_id, isMockMode);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAlertId(alert.alert_id);

    audio.onended = () => {
      setPlayingAlertId(null);
    };

    audio.onerror = () => {
      console.warn('Audio playback error for alert:', alert.alert_id);
      setAudioErrorId(alert.alert_id);
      setPlayingAlertId(null);
    };

    audio.play().catch((err) => {
      console.warn('Playback failed:', err);
      setAudioErrorId(alert.alert_id);
      setPlayingAlertId(null);
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <StatusBadge status="RED" label="HIGH SEVERITY" />;
      case 'MEDIUM':
        return <StatusBadge status="AMBER" label="MEDIUM SEVERITY" />;
      case 'LOW':
        return <StatusBadge status="GREEN" label="LOW SEVERITY" />;
      default:
        return <StatusBadge status="AMBER" label={severity} />;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <PageHeader
        title="Multilingual Alerts & Voice Notes"
        subtitle="Real-time operational notifications with multilingual translation and synthesized voice note alerts."
        badge={<StatusBadge status="RED" label="GET /alerts" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Alerts' },
        ]}
        actionSlot={
          <button
            type="button"
            onClick={loadAlerts}
            className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-xs font-semibold text-medex-secondary hover:text-medex-primary transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Contract Filters */}
      <FilterBar
        title="Contract Filters (GET /alerts)"
        onReset={() => {
          setSelectedLanguage('en-IN');
          setAcknowledgedFilter('ALL');
        }}
      >
        <Select
          label="Translation Language"
          value={selectedLanguage}
          onChange={(val) => setSelectedLanguage(val as Language)}
          options={[
            { value: 'en-IN', label: 'English (en-IN)' },
            { value: 'ta-IN', label: 'தமிழ் (ta-IN)' },
            { value: 'hi-IN', label: 'हिन्दी (hi-IN)' },
          ]}
        />

        <Select
          label="Acknowledgment Status"
          value={acknowledgedFilter}
          onChange={setAcknowledgedFilter}
          options={[
            { value: 'ALL', label: 'All Alerts' },
            { value: 'FALSE', label: 'Active (Unacknowledged)' },
            { value: 'TRUE', label: 'Acknowledged' },
          ]}
        />
      </FilterBar>

      {/* Alerts List */}
      <SectionCard
        title="Active Operational Alerts"
        subtitle="Highest severity alerts displayed first with escalation levels (PHC → BLOCK → DISTRICT → STATE)"
        actionSlot={
          <span className="text-2xs font-mono text-medex-cyan font-bold">
            {alerts.length} Alerts Loaded
          </span>
        }
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-28 rounded-xl" />
            <Skeleton className="w-full h-28 rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to Load Alerts"
            message={errorMessage}
            onRetry={loadAlerts}
          />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No Active Alerts"
            description="No alerts match the selected district, language, or acknowledgment filters."
          />
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const isPlaying = playingAlertId === alert.alert_id;
              const hasAudioError = audioErrorId === alert.alert_id;

              return (
                <div
                  key={alert.alert_id}
                  className={`p-4 rounded-xl border transition-all ${
                    alert.severity === 'HIGH'
                      ? 'bg-medex-red/10 border-medex-red/40'
                      : alert.severity === 'MEDIUM'
                      ? 'bg-medex-amber/10 border-medex-amber/40'
                      : 'bg-medex-surface/40 border-medex-border'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-medex-border/60">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-medex-cyan" />
                      <span className="text-xs font-bold font-mono text-medex-primary">
                        {alert.alert_id}
                      </span>
                      {getSeverityBadge(alert.severity)}
                      <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-medex-surface border border-medex-border text-medex-secondary">
                        Escalation: {alert.escalation_level}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-2xs font-mono text-medex-muted">
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                      {alert.acknowledged && (
                        <span className="px-2 py-0.5 rounded bg-medex-green/15 text-medex-green-light font-bold">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-medex-primary">
                      <span>{alert.facility_name} ({alert.facility_id})</span>
                      {alert.drug_code && (
                        <span className="text-2xs font-mono text-medex-cyan">
                          · {alert.drug_code}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-medex-secondary font-sans leading-relaxed">
                      "{alert.message}"
                    </p>

                    {/* Voice Note Audio Action */}
                    {alert.audio_url && (
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleAudio(alert)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono inline-flex items-center gap-2 transition-all border ${
                            isPlaying
                              ? 'bg-medex-cyan text-medex-bg border-medex-cyan shadow-md animate-pulse'
                              : 'bg-medex-surface border-medex-border text-medex-cyan hover:bg-medex-cyan/15'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause Audio Voice Note</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Play Voice Note ({alert.language})</span>
                            </>
                          )}
                        </button>

                        {hasAudioError && (
                          <span className="text-2xs font-mono text-medex-red-light flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Audio playback unavailable
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
