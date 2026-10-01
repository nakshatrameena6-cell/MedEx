import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Alert, Language } from '../../types/api';
import { listAlerts, getAlertAudioUrl } from '../../services/alertsService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Card3D } from '../../components/3d/Card3D';
import { COPY } from '../../constants/copy';
import {
  Bell,
  Play,
  Pause,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  RotateCcw,
  Building2,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext';
import { SwipeRow, JellyRadio } from '../../components/reactbits';

export const AlertsPage: React.FC = () => {
  const { role, district, user, isMockMode } = useAuthRole();
  const toast = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en-IN');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('ALL');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [playingAlertId, setPlayingAlertId] = useState<string | null>(null);
  const [audioErrorId, setAudioErrorId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAlerts = async (isManualRefresh = false) => {
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
      if (isManualRefresh) {
        toast.success('Alerts list refreshed');
      }
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load multilingual alerts.');
      toast.error(err.message || 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, acknowledged: true } : a))
    );
    toast.success(`Alert ${alertId} acknowledged`);
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
      setAudioErrorId(alert.alert_id);
      setPlayingAlertId(null);
    };

    audio.play().catch((err) => {
      console.warn('Playback failed:', err);
      setAudioErrorId(alert.alert_id);
      setPlayingAlertId(null);
    });
  };

  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  let activeFilterCount = 0;
  if (selectedLanguage !== 'en-IN') activeFilterCount += 1;
  if (acknowledgedFilter !== 'ALL') activeFilterCount += 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 font-sans text-theme-text"
    >
      {/* Page Header */}
      <div className="relative">
        <PageHeader
          title={COPY.headers.alertsTitle}
          subtitle={`${alerts.length} operational alerts logged in District ${district}`}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
          actionSlot={
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadAlerts(true)}
              isLoading={isLoading}
            >
              {COPY.actions.refresh}
            </Button>
          }
        />

        {/* Filters Popover */}
        {isFilterPopoverOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 top-12 z-30 w-80 bg-theme-surface/95 border border-theme-border rounded-2xl shadow-2xl p-5 space-y-4 font-sans backdrop-blur-xl animate-slide-up text-theme-text"
          >
            <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
              <h3 className="text-[14px] font-semibold text-theme-text">Filter Alerts</h3>
              <button
                type="button"
                onClick={() => setIsFilterPopoverOpen(false)}
                className="p-1 rounded text-theme-muted hover:text-theme-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
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
            </div>

            <div className="pt-2.5 border-t border-theme-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedLanguage('en-IN');
                  setAcknowledgedFilter('ALL');
                }}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-theme-muted hover:text-theme-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <Button variant="primary" size="sm" onClick={() => setIsFilterPopoverOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Max 3 KPI Cards with 3D Tilt Physics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: High Severity (Hero Card) */}
          <Card3D 
            specularColor="rgba(239, 68, 68, 0.28)" 
            className="p-6 rounded-2xl border border-theme-critical/40 bg-theme-surface/90 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-[13px] text-theme-muted">
              <span className="font-mono text-[10px] tracking-wider text-theme-critical uppercase font-bold">[01] HIGH SEVERITY</span>
              <StatusBadge status="RED" label="Critical" size="sm" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[42px] font-bold text-theme-critical leading-none tracking-tight font-mono">
                {highCount}
              </span>
              <span className="text-[12px] text-theme-muted font-medium">unresolved alerts</span>
            </div>
            <div className="mt-3 text-[11px] text-theme-muted font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-critical animate-ping" />
              Immediate escalation protocol
            </div>
          </Card3D>

          {/* Card 2: Active Unacknowledged */}
          <Card3D 
            specularColor="rgba(245, 158, 11, 0.22)" 
            className="p-6 rounded-2xl border border-theme-border bg-theme-surface/90 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-[13px] text-theme-muted">
              <span className="font-mono text-[10px] tracking-wider text-theme-warning-text uppercase font-bold">[02] PENDING REVIEW</span>
              <StatusBadge status="AMBER" label="Watch" size="sm" />
            </div>
            <div className="mt-4">
              <span className="text-[42px] font-bold text-theme-text leading-none tracking-tight font-mono">
                {activeCount}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-theme-muted font-mono">
              Requiring supervisor acknowledgment
            </p>
          </Card3D>

          {/* Card 3: Total Alerts */}
          <Card3D 
            specularColor="rgba(56, 189, 248, 0.22)" 
            className="p-6 rounded-2xl border border-theme-border bg-theme-surface/90 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-[13px] text-theme-muted">
              <span className="font-mono text-[10px] tracking-wider text-theme-primary uppercase font-bold">[03] TOTAL LOGGED</span>
              <Bell className="w-4 h-4 text-theme-muted" strokeWidth={1.8} />
            </div>
            <div className="mt-4">
              <span className="text-[42px] font-bold text-theme-text leading-none tracking-tight font-mono">
                {alerts.length}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-theme-muted font-mono">
              Aggregated across all facilities
            </p>
          </Card3D>
        </div>
      )}

      {/* ReactBits JellyRadio Interactive Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-theme-border bg-theme-surface/70 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-theme-muted">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>SWIPE ROW ACTIVE: SWIPE ALERT LEFT OR RIGHT TO ACTION / ACKNOWLEDGE</span>
        </div>
        <JellyRadio
          items={[
            { value: 'ALL', label: `All (${alerts.length})` },
            { value: 'FALSE', label: `Pending (${activeCount})` },
            { value: 'TRUE', label: `Ack'd (${alerts.length - activeCount})` },
          ]}
          value={acknowledgedFilter}
          onChange={(val: string) => setAcknowledgedFilter(val)}
          chipColor="var(--color-surface)"
          activeColor="var(--palette-lime)"
          textColor="var(--color-text)"
          activeTextColor="var(--palette-coffee)"
          size="sm"
          radius={12}
        />
      </div>

      {/* Alerts Main List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load alerts"
          message={errorMessage}
          onRetry={() => loadAlerts(true)}
        />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No active alerts"
          description="No alerts match the selected criteria."
          action={
            activeFilterCount > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedLanguage('en-IN');
                  setAcknowledgedFilter('ALL');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {alerts.map((alert, idx) => {
              const isPlaying = playingAlertId === alert.alert_id;
              const hasAudioError = audioErrorId === alert.alert_id;
              const isHigh = alert.severity === 'HIGH';
              const isMedium = alert.severity === 'MEDIUM';

              const railClass = isHigh
                ? 'border-l-[4px] border-l-theme-critical bg-theme-surface/90'
                : isMedium
                ? 'border-l-[4px] border-l-amber-500 bg-theme-surface/90'
                : 'border-l-[4px] border-l-emerald-500 bg-theme-surface/90';

              const SeverityIcon = isHigh ? AlertTriangle : isMedium ? Clock : CheckCircle2;

              return (
                <SwipeRow
                  key={alert.alert_id}
                  actions={[
                    {
                      id: 'ack',
                      label: alert.acknowledged ? 'Acknowledged' : 'Acknowledge',
                      color: '#8CBFFF',
                    },
                    {
                      id: 'dismiss',
                      label: 'Dismiss',
                      color: '#FF807B',
                    },
                  ]}
                  onAction={(actionId: string) => {
                    if (actionId === 'ack') {
                      handleAcknowledge(alert.alert_id);
                    } else if (actionId === 'dismiss') {
                      setAlerts((prev) => prev.filter((a) => a.alert_id !== alert.alert_id));
                      toast.info(`Alert ${alert.alert_id} dismissed`);
                    }
                  }}
                  rowColor="transparent"
                  drawerColor="var(--color-bg)"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    className={`p-6 rounded-2xl border border-theme-border shadow-xl backdrop-blur-xl space-y-4 transition-all ${railClass} ${
                      !alert.acknowledged ? 'ring-1 ring-white/15' : 'opacity-85'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-theme-border">
                      <div className="flex items-center gap-2.5 text-[13px]">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isHigh ? 'bg-red-500/10 text-theme-critical' : isMedium ? 'bg-amber-500/10 text-theme-warning-text' : 'bg-emerald-500/10 text-theme-healthy-text'
                        }`}>
                          <SeverityIcon className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <span className="font-bold font-mono text-theme-text text-[14px]">
                          {alert.alert_id}
                        </span>
                        <StatusBadge
                          status={isHigh ? 'RED' : isMedium ? 'AMBER' : 'GREEN'}
                          size="sm"
                        />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-theme-border text-theme-muted uppercase">
                          Escalation: Level {alert.escalation_level}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-theme-muted">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>

                        {!alert.acknowledged && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.alert_id)}
                            className="shadow-sm"
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 text-[14px]">
                      <div className="flex items-center gap-2 text-theme-text font-semibold">
                        <Building2 className="w-4 h-4 text-theme-muted" strokeWidth={1.8} />
                        <span>{alert.facility_name} ({alert.facility_id})</span>
                        {alert.drug_code && (
                          <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-theme-primary/10 border border-theme-primary/20 text-theme-primary">
                            {alert.drug_code}
                          </span>
                        )}
                      </div>
                      <p className="text-theme-text/90 font-normal leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-theme-border">
                        "{alert.message}"
                      </p>
                    </div>

                    {/* Voice Note Secondary Action */}
                    {alert.audio_url && (
                      <div className="pt-2 flex items-center justify-between border-t border-theme-border">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={isPlaying ? Pause : Play}
                            onClick={() => handleToggleAudio(alert)}
                            className={isPlaying ? 'border-theme-primary text-theme-primary shadow-lg shadow-theme-primary/20' : ''}
                          >
                            {isPlaying ? 'Pause Voice Note' : `Play voice note (${alert.language})`}
                          </Button>
                          {isPlaying && (
                            <div className="flex items-center gap-1">
                              <span className="w-1 h-3 bg-theme-primary animate-pulse rounded-full" />
                              <span className="w-1 h-5 bg-theme-primary animate-pulse delay-75 rounded-full" />
                              <span className="w-1 h-2 bg-theme-primary animate-pulse delay-150 rounded-full" />
                              <span className="text-[11px] font-mono text-theme-primary ml-1">AUDIO PLAYING</span>
                            </div>
                          )}
                        </div>

                        {hasAudioError && (
                          <span className="text-[12px] text-theme-critical font-mono">
                            Audio playback unavailable
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                </SwipeRow>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

