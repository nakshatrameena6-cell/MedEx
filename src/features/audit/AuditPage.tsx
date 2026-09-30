import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthRole } from '../../context/AuthRoleContext';
import { AuditAction, AuditEntry, AuditEntityType } from '../../types/api';
import { listAudit } from '../../services/auditService';
import { PageHeader } from '../../components/common/PageHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { FiltersPopover } from '../../components/common/FiltersPopover';
import { Skeleton } from '../../components/common/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { Select } from '../../components/common/Select';
import { COPY } from '../../constants/copy';
import {
  ShieldCheck,
  RefreshCw,
  User,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  Activity,
  Terminal,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext';

export const AuditPage: React.FC = () => {
  const { role, district, user, isMockMode } = useAuthRole();
  const toast = useToast();

  const [actorFilter, setActorFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [limitFilter, setLimitFilter] = useState<string>('50');

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeFilterCount =
    (actorFilter.trim() !== '' ? 1 : 0) +
    (actionFilter !== 'ALL' ? 1 : 0) +
    (entityTypeFilter !== 'ALL' ? 1 : 0) +
    (limitFilter !== '50' ? 1 : 0);

  const loadAuditData = async (isManualRefresh = false) => {
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
      const data = await listAudit(
        {
          actor: actorFilter.trim() || undefined,
          action: actionFilter !== 'ALL' ? (actionFilter as AuditAction) : undefined,
          entity_type: entityTypeFilter !== 'ALL' ? (entityTypeFilter as AuditEntityType) : undefined,
          limit: parseInt(limitFilter, 10),
        },
        headers
      );
      setAuditEntries(data.items);
      if (isManualRefresh) {
        toast.success('Audit log refreshed');
      }
    } catch (err: any) {
      console.error('Failed to load audit trail:', err);
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load append-only audit trail.');
      toast.error(err.message || 'Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [role, district, user, isMockMode, actionFilter, entityTypeFilter, limitFilter]);

  const handleExportCsv = () => {
    if (auditEntries.length === 0) return;
    const headers = ['Audit ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Comment'];
    const rows = auditEntries.map((e) => [
      e.audit_id,
      new Date(e.ts).toISOString(),
      `"${e.actor.replace(/"/g, '""')}"`,
      e.role,
      e.action,
      e.entity_type,
      e.entity_id,
      `"${(e.comment || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medex_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJson = (entry: AuditEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    setCopiedId(entry.audit_id);
    toast.success(`Copied payload for ${entry.audit_id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (auditId: string) => {
    setExpandedId(expandedId === auditId ? null : auditId);
  };

  const renderJsonSyntax = (jsonObj: any) => {
    const jsonString = JSON.stringify(jsonObj, null, 2);
    const html = jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-theme-warning-text';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-teal-400 font-semibold';
          } else {
            cls = 'text-emerald-300';
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-400 font-bold';
        } else if (/null/.test(match)) {
          cls = 'text-theme-critical italic';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
    return <code dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const uniqueActors = new Set(auditEntries.map((e) => e.actor)).size;
  const uniqueActions = new Set(auditEntries.map((e) => e.action)).size;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 text-left font-sans"
    >
      <PageHeader
        title={COPY.headers.auditTitle}
        subtitle={COPY.headers.auditSubtitle}
        badge={<StatusBadge status="CYAN" label="GET /audit" />}
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'Audit Trail' }]}
        actionSlot={
          <div className="flex items-center gap-3">
            <FiltersPopover
              activeCount={activeFilterCount}
              onReset={() => {
                setActorFilter('');
                setActionFilter('ALL');
                setEntityTypeFilter('ALL');
                setLimitFilter('50');
              }}
            >
              <div>
                <label className="text-[12px] font-medium text-theme-muted block mb-1">Actor / User ID</label>
                <input
                  type="text"
                  value={actorFilter}
                  onChange={(e) => setActorFilter(e.target.value)}
                  placeholder="e.g. user_phc_01"
                  className="w-full bg-theme-surface border border-theme-border-control rounded-lg p-2 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                />
              </div>

              <Select
                label="Audit Action"
                value={actionFilter}
                onChange={setActionFilter}
                options={[
                  { value: 'ALL', label: 'All Actions' },
                  { value: 'CAPTURE_CONFIRM', label: 'CAPTURE_CONFIRM' },
                  { value: 'OPTIMIZE_RUN', label: 'OPTIMIZE_RUN' },
                  { value: 'TRANSFER_APPROVE', label: 'TRANSFER_APPROVE' },
                  { value: 'TRANSFER_MODIFY', label: 'TRANSFER_MODIFY' },
                  { value: 'TRANSFER_REJECT', label: 'TRANSFER_REJECT' },
                  { value: 'TRANSFER_ESCALATE', label: 'TRANSFER_ESCALATE' },
                  { value: 'TRANSFER_DONE', label: 'TRANSFER_DONE' },
                  { value: 'COPILOT_QUERY', label: 'COPILOT_QUERY' },
                  { value: 'FEDERATION_ROUND', label: 'FEDERATION_ROUND' },
                ]}
              />

              <Select
                label="Entity Type"
                value={entityTypeFilter}
                onChange={setEntityTypeFilter}
                options={[
                  { value: 'ALL', label: 'All Entity Types' },
                  { value: 'FACILITY', label: 'FACILITY' },
                  { value: 'CAPTURE', label: 'CAPTURE' },
                  { value: 'TRANSFER', label: 'TRANSFER' },
                  { value: 'QUERY', label: 'QUERY' },
                  { value: 'ALERT', label: 'ALERT' },
                  { value: 'MODEL', label: 'MODEL' },
                ]}
              />

              <Select
                label="Max Limit"
                value={limitFilter}
                onChange={setLimitFilter}
                options={[
                  { value: '10', label: '10 Entries' },
                  { value: '25', label: '25 Entries' },
                  { value: '50', label: '50 Entries' },
                  { value: '100', label: '100 Entries' },
                ]}
              />
            </FiltersPopover>

            <Button
              variant="primary"
              onClick={handleExportCsv}
              disabled={auditEntries.length === 0}
              className="shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Max 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard
          title={COPY.metrics.totalRecords}
          value={auditEntries.length}
          unit="events"
          className="border-theme-primary/40 border-2"
          status="GREEN"
          icon={ShieldCheck}
          subtext="Append-only log records"
        />

        <KpiCard
          title="Unique Actors"
          value={uniqueActors}
          unit="actors"
          status="NEUTRAL"
          icon={User}
        />

        <KpiCard
          title="Governed Actions"
          value={uniqueActions}
          unit="types"
          status="NEUTRAL"
          icon={Activity}
        />
      </div>

      {/* Table Container */}
      <div className="bg-theme-surface/85 backdrop-blur-xl border border-theme-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-theme-border flex items-center justify-center text-theme-primary">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-theme-text">Read-Only Audit Log</h2>
              <p className="text-[11px] font-mono text-theme-muted">IMMUTABLE CRYPTOGRAPHIC EVENT LEDGER // NEWEST FIRST</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => loadAuditData(true)}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState title="Audit Log Unavailable" message={errorMessage} onRetry={() => loadAuditData(true)} />
        ) : auditEntries.length === 0 ? (
          <EmptyState title="No Audit Records" description="No governance events match the selected filters." />
        ) : (
          <div className="overflow-x-auto border border-theme-border rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-theme-border bg-white/[0.02] text-theme-muted text-[11px] font-mono uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Audit ID</th>
                  <th scope="col" className="py-3 px-4">Timestamp (UTC)</th>
                  <th scope="col" className="py-3 px-4">Actor & Role</th>
                  <th scope="col" className="py-3 px-4">Action</th>
                  <th scope="col" className="py-3 px-4">Entity Target</th>
                  <th scope="col" className="py-3 px-4">Comment</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {auditEntries.map((entry) => {
                  const isExpanded = expandedId === entry.audit_id;
                  const isCopied = copiedId === entry.audit_id;

                  return (
                    <React.Fragment key={entry.audit_id}>
                      <tr
                        onClick={() => toggleExpand(entry.audit_id)}
                        className={`h-[56px] hover:bg-white/[0.04] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                      >
                        <td className="py-2.5 px-4 font-mono text-xs font-bold text-theme-primary">
                          {entry.audit_id}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-2xs text-theme-muted whitespace-nowrap">
                          {new Date(entry.ts).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4">
                          <div>
                            <span className="font-mono text-xs font-bold text-theme-text flex items-center gap-1.5">
                              <User className="w-3 h-3 text-theme-primary" />
                              {entry.actor}
                            </span>
                            <span className="text-[10px] font-mono text-theme-muted">
                              Role: <strong className="text-theme-text">{entry.role}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/25">
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div>
                            <span className="font-mono text-[10px] text-theme-muted uppercase block">
                              {entry.entity_type}
                            </span>
                            <span className="font-mono text-xs font-bold text-theme-text">
                              {entry.entity_id}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 max-w-xs truncate text-theme-muted font-mono text-2xs">
                          {entry.comment ? (
                            <span className="italic font-sans text-xs text-theme-text">{entry.comment}</span>
                          ) : (
                            <span className="opacity-75">{JSON.stringify({ actor: entry.actor, action: entry.action, entity: entry.entity_id }).slice(0, 42)}...</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleCopyJson(entry, e)}
                              className="p-1.5 rounded-md text-theme-muted hover:text-theme-text hover:bg-white/10 transition-colors"
                              title="Copy raw JSON payload"
                              aria-label="Copy raw JSON"
                            >
                              {isCopied ? <Check className="w-4 h-4 text-theme-healthy" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpand(entry.audit_id)}
                              className="p-1.5 rounded-md text-theme-muted hover:text-theme-text hover:bg-white/10 transition-colors"
                              title={isExpanded ? 'Collapse JSON' : 'Expand JSON payload'}
                              aria-label="Toggle JSON drawer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail Row */}
                      {isExpanded && (
                        <tr className="bg-black/40 border-b border-theme-border">
                          <td colSpan={7} className="p-4">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2 overflow-hidden"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold uppercase text-theme-muted flex items-center gap-2">
                                  <span>Raw Audit Record Payload ({entry.audit_id})</span>
                                  <span className="px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary text-[10px] font-semibold border border-theme-primary/20">Syntax Highlighted</span>
                                </span>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => handleCopyJson(entry, e)}
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                  <span>{isCopied ? 'Copied!' : 'Copy Payload'}</span>
                                </Button>
                              </div>
                              <pre className="text-2xs font-mono bg-[#090D14] p-4 rounded-xl border border-theme-border text-slate-100 overflow-x-auto max-h-72 scrollbar-thin shadow-inner leading-relaxed">
                                {renderJsonSyntax(entry)}
                              </pre>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

