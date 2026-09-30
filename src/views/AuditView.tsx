import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import { Select } from '../components/common/Select';
import { DataTable, Column } from '../components/common/DataTable';
import { Shield } from 'lucide-react';

interface MockAuditRow {
  audit_id: string;
  ts: string;
  actor: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  comment?: string;
}

export const AuditView: React.FC = () => {
  const sampleAuditData: MockAuditRow[] = [
    {
      audit_id: 'AUD-001203',
      ts: '2026-09-29T06:40:00Z',
      actor: 'dho.d01',
      role: 'DISTRICT',
      action: 'TRANSFER_APPROVE',
      entity_type: 'TRANSFER',
      entity_id: 'T-001',
      comment: 'Approved for dispatch',
    },
    {
      audit_id: 'AUD-001202',
      ts: '2026-09-29T06:35:00Z',
      actor: 'dho.d01',
      role: 'DISTRICT',
      action: 'OPTIMIZE_RUN',
      entity_type: 'TRANSFER',
      entity_id: 'RUN-000031',
      comment: 'OR-Tools run completed with 1 proposal',
    },
  ];

  const columns: Column<MockAuditRow>[] = [
    {
      key: 'audit_id',
      header: 'Audit ID',
      render: (r) => <span className="font-mono text-2xs text-medex-cyan">{r.audit_id}</span>,
      width: '110px',
    },
    {
      key: 'ts',
      header: 'Timestamp (UTC)',
      render: (r) => <span className="font-mono text-2xs text-medex-secondary">{r.ts}</span>,
    },
    {
      key: 'actor',
      header: 'Actor & Role',
      render: (r) => (
        <div>
          <span className="font-semibold text-medex-primary block">{r.actor}</span>
          <span className="text-2xs font-mono text-medex-muted">{r.role}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <span className="font-mono text-2xs px-2 py-0.5 rounded bg-medex-elevated border border-medex-border text-medex-primary font-semibold">
          {r.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (r) => (
        <span className="font-mono text-2xs text-medex-secondary">
          {r.entity_type}: {r.entity_id}
        </span>
      ),
    },
    {
      key: 'comment',
      header: 'Decision Comment',
      render: (r) => (
        <span className="text-2xs text-medex-secondary italic truncate max-w-xs block">
          {r.comment || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Append-Only Audit Trail"
        subtitle="Immutable log of all operational decisions, capture confirmations, transfer approvals, copilot queries, and federated rounds."
        badge={<StatusBadge status="CYAN" label="GET /audit" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Audit Trail' },
        ]}
      />

      <div className="p-3 bg-medex-surface/60 border border-medex-border rounded-md text-2xs text-medex-secondary flex items-center gap-2">
        <Shield className="w-4 h-4 text-medex-cyan shrink-0" />
        <span>
          Read-only endpoint. `AUDITOR` and `STATE` roles see all districts; `DISTRICT` role sees its own district records. Any write attempt returns 403 Forbidden.
        </span>
      </div>

      <FilterBar title="Audit Filters">
        <Select
          label="Action Type"
          value="ALL"
          onChange={() => {}}
          options={[
            { value: 'ALL', label: 'All Actions' },
            { value: 'TRANSFER_APPROVE', label: 'TRANSFER_APPROVE' },
            { value: 'CAPTURE_CONFIRM', label: 'CAPTURE_CONFIRM' },
            { value: 'OPTIMIZE_RUN', label: 'OPTIMIZE_RUN' },
            { value: 'COPILOT_QUERY', label: 'COPILOT_QUERY' },
            { value: 'FEDERATION_ROUND', label: 'FEDERATION_ROUND' },
          ]}
        />
        <Select
          label="Entity Type"
          value="ALL"
          onChange={() => {}}
          options={[
            { value: 'ALL', label: 'All Entities' },
            { value: 'TRANSFER', label: 'TRANSFER' },
            { value: 'CAPTURE', label: 'CAPTURE' },
            { value: 'FACILITY', label: 'FACILITY' },
            { value: 'QUERY', label: 'QUERY' },
          ]}
        />
      </FilterBar>

      <SectionCard
        title="Audit Event Log Table"
        subtitle="Paged via next_cursor, sorted newest first"
      >
        <DataTable
          columns={columns}
          data={sampleAuditData}
          getRowId={(r) => r.audit_id}
        />
      </SectionCard>
    </div>
  );
};
