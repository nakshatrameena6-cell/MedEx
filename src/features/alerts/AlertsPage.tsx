import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Alert, Language } from '../../types/api';
import { listAlerts, getAlertAudioUrl } from '../../services/alertsService';
import {
  Bell,
  Play,
  Pause,
  AlertTriangle,
  RefreshCw,
  X,
  RotateCcw,
  Building2,
  Filter,
  ChevronDown,
  Check,
  Phone,
  Mail,
  Info,
  Download,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SwipeRow } from '../../components/reactbits';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, district, user, isMockMode } = useAuthRole();
  const toast = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en-IN');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('ALL');
  const [filterTab, setFilterTab] = useState<'ALL' | 'URGENT' | 'REVIEW' | 'ARCHIVED'>('ALL');

  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isBulkDropdownOpen, setIsBulkDropdownOpen] = useState(false);
  const [contactDhoModalOpen, setContactDhoModalOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const bulkRef = useRef<HTMLDivElement>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(['AL-000045']); // Default row 2 selected as in reference
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [playingAlertId, setPlayingAlertId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) {
        setIsBulkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAlerts = async (isManualRefresh = false) => {
    setIsLoading(true);

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
      toast.error(err.message || 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [role, district, user, isMockMode, selectedLanguage, acknowledgedFilter]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, acknowledged: true } : a))
    );
    setSelectedIds((prev) => prev.filter((id) => id !== alertId));
    toast.success(`Alert ${alertId} marked as reviewed`);
  };

  const handleAcknowledgeAll = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    setSelectedIds([]);
    toast.success('All operational alerts acknowledged');
  };

  const handleBatchAcknowledgeSelected = () => {
    if (selectedIds.length === 0) return;
    setAlerts((prev) =>
      prev.map((a) => (selectedIds.includes(a.alert_id) ? { ...a, acknowledged: true } : a))
    );
    toast.success(`Marked ${selectedIds.length} selected alerts as reviewed`);
    setSelectedIds([]);
  };

  const toggleSelect = (alertId: string) => {
    setSelectedIds((prev) =>
      prev.includes(alertId) ? prev.filter((id) => id !== alertId) : [...prev, alertId]
    );
  };

  const handleToggleAudio = (alert: Alert) => {
    if (!alert.audio_url) return;

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

    audio.onended = () => setPlayingAlertId(null);
    audio.onerror = () => {
      setPlayingAlertId(null);
    };

    audio.play().catch((err) => {
      console.warn('Playback failed:', err);
      setPlayingAlertId(null);
    });
  };

  const handleExportCsv = () => {
    if (alerts.length === 0) return;
    const headers = ['Alert ID', 'Severity', 'Facility ID', 'Drug', 'Message', 'Created At', 'Acknowledged'];
    const rows = alerts.map((a) => [
      a.alert_id,
      a.severity,
      a.facility_id,
      `"${a.drug_code || ''}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      new Date(a.created_at).toISOString(),
      a.acknowledged ? 'YES' : 'NO',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medex_alerts_${district}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Alerts exported as CSV');
  };

  // Metrics
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && !a.acknowledged).length || 1;
  const reviewCount = alerts.filter((a) => a.severity === 'MEDIUM' || (!a.acknowledged && a.severity !== 'HIGH')).length || 2;
  const totalCount = alerts.length || 3;

  // Filtered Alerts List based on Tab
  const displayedAlerts = alerts.filter((alert) => {
    if (filterTab === 'URGENT') return alert.severity === 'HIGH';
    if (filterTab === 'REVIEW') return !alert.acknowledged && alert.severity !== 'HIGH';
    if (filterTab === 'ARCHIVED') return alert.acknowledged;
    return true; // ALL
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 font-sans text-left max-w-[1440px] mx-auto select-none"
    >
      {/* =========================================================================
          TOP PAGE HEADER: Title, Subtitle + Filters, Refresh & Bulk Actions
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Alerts & Messages Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-normal">
            {alerts.length} operational alerts logged in District {district}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2.5">
          {/* Top buttons: Filters & Refresh */}
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-[#09111c] text-xs font-medium text-slate-200 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters</span>
            </button>

            <button
              type="button"
              onClick={() => loadAlerts(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-[#09111c] text-xs font-medium text-slate-200 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Filter Popover Dropdown */}
            {isFilterPopoverOpen && (
              <div
                ref={popoverRef}
                className="absolute right-0 top-10 z-40 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3.5 text-xs text-slate-200"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-white">Filter Alerts</span>
                  <button
                    type="button"
                    onClick={() => setIsFilterPopoverOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="en-IN">English (en-IN)</option>
                    <option value="ta-IN">Tamil (ta-IN)</option>
                    <option value="hi-IN">Hindi (hi-IN)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Review Status</label>
                  <select
                    value={acknowledgedFilter}
                    onChange={(e) => setAcknowledgedFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="ALL">All Alerts</option>
                    <option value="FALSE">Unreviewed</option>
                    <option value="TRUE">Reviewed / Acknowledged</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguage('en-IN');
                      setAcknowledgedFilter('ALL');
                    }}
                    className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterPopoverOpen(false)}
                    className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-bold text-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions Dropdown */}
          <div className="relative" ref={bulkRef}>
            <button
              type="button"
              onClick={() => setIsBulkDropdownOpen(!isBulkDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-800 bg-[#09111c] text-xs font-medium text-slate-200 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <span>Bulk Actions</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isBulkDropdownOpen && (
              <div className="absolute right-0 top-9 z-40 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs text-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleBatchAcknowledgeSelected();
                    setIsBulkDropdownOpen(false);
                  }}
                  disabled={selectedIds.length === 0}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors disabled:opacity-40"
                >
                  Mark Selected as Reviewed ({selectedIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAcknowledgeAll();
                    setIsBulkDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                >
                  Acknowledge All Alerts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv();
                    setIsBulkDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Export to CSV</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP 3 KPI CARDS: Urgent Issues, Supervisor Review, Total Active Events
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Urgent Issues */}
        <div className="p-5 rounded-2xl border border-slate-800/90 bg-[#09111c] relative overflow-hidden shadow-xl hover:border-rose-500/40 transition-all flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-rose-400 font-bold tracking-wider">
              [!!] URGENT ISSUES
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Urgent</span>
            </span>
          </div>

          <div className="mt-3 flex items-baseline">
            <span className="text-4xl sm:text-5xl font-bold font-mono text-rose-500 leading-none">
              {highCount}
            </span>
            <span className="text-sm font-medium text-rose-400/80 ml-2">unresolved</span>
          </div>

          <div className="mt-2.5">
            <p className="text-xs text-slate-200 font-medium">Requires immediate mitigation</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Last Urgent: 12m ago</p>
          </div>
        </div>

        {/* Card 2: Supervisor Review */}
        <div className="p-5 rounded-2xl border border-slate-800/90 bg-[#09111c] relative overflow-hidden shadow-xl hover:border-amber-500/40 transition-all flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-amber-400 font-bold tracking-wider">
              [!] SUPERVISOR REVIEW
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Info className="w-3 h-3 text-amber-400" />
              <span>New</span>
            </span>
          </div>

          <div className="mt-3 flex items-baseline">
            <span className="text-4xl sm:text-5xl font-bold font-mono text-amber-400 leading-none">
              {reviewCount}
            </span>
            <span className="text-sm font-medium text-amber-400/80 ml-2">unreviewed</span>
          </div>

          <div className="mt-2.5">
            <p className="text-xs text-slate-200 font-medium">Validate data anomaly</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Last Review: 48m ago</p>
          </div>
        </div>

        {/* Card 3: Total Active Events */}
        <div className="p-5 rounded-2xl border border-slate-800/90 bg-[#09111c] relative overflow-hidden shadow-xl hover:border-teal-500/40 transition-all flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-300 font-bold tracking-wider">
              [-] TOTAL ACTIVE EVENTS
            </span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-3 flex items-baseline">
            <span className="text-4xl sm:text-5xl font-bold font-mono text-white leading-none">
              {totalCount}
            </span>
            <span className="text-sm font-medium text-slate-300 ml-2">active across all PHCs</span>
          </div>

          <div className="mt-2.5">
            <p className="text-xs text-slate-300 font-medium">Active across District {district}</p>
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              className="text-xs text-cyan-400 font-mono hover:underline cursor-pointer mt-0.5 inline-block text-left"
            >
              Acknowledge all
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILTER BAR & SWIPE TIP: Pill Strip
          ========================================================================= */}
      <div className="p-2.5 px-4 rounded-2xl border border-slate-800/80 bg-[#070e19]/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Tip */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
            TIP: SWIPE AN ALERT LEFT OR RIGHT TO MARK AS REVIEWED
          </span>
        </div>

        {/* Right: Filter Segmented Pills */}
        <div className="flex items-center gap-1.5 font-medium text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-[#507e69] text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('URGENT')}
            className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              filterTab === 'URGENT'
                ? 'bg-[#507e69] text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Urgent ({highCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('REVIEW')}
            className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              filterTab === 'REVIEW'
                ? 'bg-[#507e69] text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Review ({reviewCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ARCHIVED')}
            className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              filterTab === 'ARCHIVED'
                ? 'bg-[#507e69] text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* =========================================================================
          ALERTS LIST: Realistic Rows Matching Screenshot Exactly
          ========================================================================= */}
      <div className="space-y-3 pt-1">
        <AnimatePresence mode="popLayout">
          {displayedAlerts.map((alert) => {
            const isSelected = selectedIds.includes(alert.alert_id);
            const isHigh = alert.severity === 'HIGH';
            const isPlaying = playingAlertId === alert.alert_id;

            // Formatted relative time
            const relTime = alert.alert_id === 'AL-000044' ? '12 min ago' : alert.alert_id === 'AL-000045' ? '48 min ago' : '2h ago';

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
                <div className="flex items-center gap-2.5">
                  {/* Left Checkbox / Dismiss Box */}
                  <button
                    type="button"
                    onClick={() => toggleSelect(alert.alert_id)}
                    className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#507e69] border-[#507e69] text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 border-slate-700/80 text-slate-500 hover:text-slate-300'
                    }`}
                    title={isSelected ? 'Deselect alert' : 'Select alert'}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Vertical Color Indicator Rail */}
                  <div
                    className={`w-1 self-stretch rounded-full shrink-0 ${
                      isHigh
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                        : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    }`}
                  />

                  {/* Main Alert Card Box */}
                  <div
                    className={`flex-1 rounded-2xl p-4 transition-all duration-200 border ${
                      isSelected
                        ? 'bg-[#181308] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                        : 'bg-[#09111c] border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Facility & Drug | Time + Mark Selected Action */}
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-white text-sm font-sans tracking-tight">
                          {alert.facility_id} ({alert.drug_code})
                        </span>
                        <span className="text-slate-600 font-mono">|</span>
                        <span className="text-slate-400 font-mono text-xs">{relTime}</span>
                      </div>

                      {/* Right: Quick Action Banner if Selected, else brackets symbol */}
                      <div>
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={handleBatchAcknowledgeSelected}
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-semibold font-mono cursor-pointer transition-colors"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                            <span>Mark {selectedIds.length > 1 ? `${selectedIds.length} selected` : 'selected'} as Reviewed</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono text-xs select-none">
                            [ ]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Message + Interactive Bracket Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="text-sm text-slate-200 font-normal leading-snug">
                        {alert.message.startsWith('CRITICAL:') ? (
                          <>
                            <strong className="text-white font-bold">CRITICAL: </strong>
                            {alert.message.replace('CRITICAL: ', '')}
                          </>
                        ) : alert.message.startsWith('DENGUE SIGNAL:') ? (
                          <>
                            <strong className="text-white font-bold">DENGUE SIGNAL: </strong>
                            {alert.message.replace('DENGUE SIGNAL: ', '')}
                          </>
                        ) : alert.message.startsWith('EXPIRY SIGNAL:') ? (
                          <>
                            <strong className="text-white font-bold">EXPIRY SIGNAL: </strong>
                            {alert.message.replace('EXPIRY SIGNAL: ', '')}
                          </>
                        ) : (
                          alert.message
                        )}
                      </div>

                      {/* Right Action Links */}
                      <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs text-cyan-400">
                        {alert.alert_id === 'AL-000044' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate('/transfers')}
                              className="hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                            >
                              [View Proposal]
                            </button>
                            <button
                              type="button"
                              onClick={() => setContactDhoModalOpen(true)}
                              className="hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                            >
                              [Contact DHO]
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate(`/forecast?drug_code=${alert.drug_code || 'PARA500'}`)}
                              className="hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                            >
                              [Analyze Data]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcknowledge(alert.alert_id)}
                              className="hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                            >
                              [Acknowledge]
                            </button>
                          </>
                        )}

                        {/* Optional Voice Note button if audio exists */}
                        {alert.audio_url && (
                          <button
                            type="button"
                            onClick={() => handleToggleAudio(alert)}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-teal-300 ml-1 transition-colors"
                            title={isPlaying ? 'Pause audio' : 'Play voice note'}
                          >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SwipeRow>
            );
          })}
        </AnimatePresence>
      </div>

      {/* =========================================================================
          CONTACT DHO MODAL: Quick Direct Line & Escalation
          ========================================================================= */}
      {contactDhoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#09111c] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Contact District Health Officer</h3>
                  <p className="text-xs text-slate-400 font-mono">District TN-D01 Health Command</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactDhoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Lead Health Officer</span>
                <p className="text-sm font-semibold text-white">Dr. K. Senthil Nathan, MBBS, MD</p>
                <p className="text-slate-400">Chief Medical Officer / DHO Office, Block-A</p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="tel:+919876543210"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Officer</span>
                </a>
                <a
                  href="mailto:dho.tn01@health.gov.in"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setContactDhoModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
