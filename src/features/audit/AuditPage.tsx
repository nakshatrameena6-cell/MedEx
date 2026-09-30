import React, { useState, useEffect } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { AuditAction, AuditEntry, AuditEntityType } from '../../types/api';
import { listAudit } from '../../services/auditService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FilterBar } from '../../components/common/FilterBar';
import { Select } from '../../components/common/Select';
import { DataTable, Column } from '../../components/common/DataTable';
import { ShieldCheck, RefreshCw, User } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { role, district, user, isMockMode } = useAuthRole();

  const [actorFilter, setActorFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [limitFilter, setLimitFilter] = useState<string>('50');

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadAuditData = async () => {
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
    } catch (err: any) {
      console.error('Failed to load audit trail:', err);
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load append-only audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [role, district, user, isMockMode, actionFilter, entityTypeFilter, limitFilter]);

  const columns: Column<AuditEntry>[] = [
    {
      key: 'audit_id',
      header: 'Audit ID',
      render: (entry) => (
        <span className="font-mono text-xs font-bold text-medex-cyan">
          {entry.audit_id}
        </span>
      ),
      width: '110px',
    },
    {
      key: 'ts',
      header: 'Timestamp (UTC)',
      render: (entry) => (
        <span className="font-mono text-2xs text-medex-secondary whitespace-nowrap">
          {new Date(entry.ts).toLocaleString()}
        </span>
      ),
      width: '160px',
    },
    {
      key: 'actor',
      header: 'Actor & Role',
      render: (entry) => (
        <div>
          <span className="font-mono text-xs font-bold text-medex-primary block flex items-center gap-1">
            <User className="w-3 h-3 text-medex-cyan" />
            {entry.actor}
          </span>
          <span className="text-2xs font-mono text-medex-muted">
            Role: <strong className="text-medex-secondary">{entry.role}</strong>
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (entry) => (
        <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-medex-cyan/15 text-medex-cyan border border-medex-cyan/30">
          {entry.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity Target',
      render: (entry) => (
        <div>
          <span className="font-mono text-2xs text-medex-secondary uppercase block">
            {entry.entity_type}
          </span>
          <span className="font-mono text-xs font-bold text-medex-primary">
            {entry.entity_id}
          </span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Comment & Governance Details',
      render: (entry) => (
        <div className="space-y-1 max-w-sm font-sans text-xs">
          {entry.comment && (
            <p className="text-medex-primary leading-normal italic">
              "{entry.comment}"
            </p>
          )}
          {entry.details && (
            <pre className="text-[10px] font-mono bg-medex-bg/60 p-1.5 rounded border border-medex-border text-medex-secondary overflow-x-auto">
              {JSON.stringify(entry.details)}
            </pre>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left font-sans">
      <PageHeader
        title="Immutable Governance Audit Trail"
        subtitle="Append-only audit log recording stock updates, transfer decisions, scenario runs, and copilot queries."
        badge={<StatusBadge status="CYAN" label="GET /audit" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Audit Trail' },
        ]}
        actionSlot={
          <button
            type="button"
            onClick={loadAuditData}
            className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-xs font-semibold text-medex-secondary hover:text-medex-primary transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Audit Banner */}
      <div className="p-4 bg-medex-surface/60 border border-medex-border rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-medex-cyan/15 text-medex-cyan border border-medex-cyan/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-medex-primary font-mono uppercase">
              Append-Only Ledger Compliance
            </h4>
            <p className="text-2xs text-medex-secondary font-mono">
              Scope: {role === 'STATE' || role === 'AUDITOR' ? 'All Districts (Global Audit)' : `District ${district} Audit`}
            </p>
          </div>
        </div>

        <span className="text-2xs font-mono font-bold text-medex-cyan bg-medex-cyan/15 px-2.5 py-1 rounded border border-medex-cyan/30">
          READ-ONLY LOG
        </span>
      </div>

      {/* Contract Filters */}
      <FilterBar
        title="Contract Filters (GET /audit)"
        onReset={() => {
          setActorFilter('');
          setActionFilter('ALL');
          setEntityTypeFilter('ALL');
          setLimitFilter('50');
        }}
      >
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
          label="Limit"
          value={limitFilter}
          onChange={setLimitFilter}
          options={[
            { value: '10', label: '10 Entries' },
            { value: '25', label: '25 Entries' },
            { value: '50', label: '50 Entries' },
            { value: '100', label: '100 Entries' },
          ]}
        />
      </FilterBar>

      {/* Audit Log Table */}
      <SectionCard
        title="Audit Log Records"
        subtitle="Chronological audit records ordered newest first (read-only governance)"
        actionSlot={
          <span className="text-2xs font-mono text-medex-cyan font-bold">
            {auditEntries.length} Records Loaded
          </span>
        }
      >
        <DataTable
          columns={columns}
          data={auditEntries}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={loadAuditData}
          getRowId={(e) => e.audit_id}
          emptyTitle="No Audit Entries Found"
          emptyDescription="No append-only audit entries match the current filters."
        />
      </SectionCard>
    </div>
  );
};
