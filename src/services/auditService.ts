import { AuditAction, AuditEntityType, AuditList } from '../types/api';
import { fetchApi } from './apiClient';

export interface ListAuditParams {
  actor?: string;
  action?: AuditAction;
  entity_type?: AuditEntityType;
  entity_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

const SAMPLE_AUDIT_ENTRIES: AuditList = {
  items: [
    {
      audit_id: 'AUD-001205',
      ts: '2026-09-29T07:15:00Z',
      actor: 'pharmacist.phc014',
      role: 'FACILITY',
      action: 'CAPTURE_CONFIRM',
      entity_type: 'CAPTURE',
      entity_id: 'SNAP-000482',
      comment: 'Confirmed stock snapshot after voice entry review',
      details: { facility_id: 'TN-PHC-014', rows_saved: 2 },
    },
    {
      audit_id: 'AUD-001204',
      ts: '2026-09-29T06:50:00Z',
      actor: 'state.health.director',
      role: 'STATE',
      action: 'FEDERATION_ROUND',
      entity_type: 'MODEL',
      entity_id: 'FR-0007',
      comment: 'Triggered federated training round 7 across TN, BR, MH state nodes',
      details: { global_mape: 14.9, model_version: 'fed-v7' },
    },
    {
      audit_id: 'AUD-001203',
      ts: '2026-09-29T06:40:00Z',
      actor: 'dho.d01',
      role: 'DISTRICT',
      action: 'TRANSFER_APPROVE',
      entity_type: 'TRANSFER',
      entity_id: 'T-001',
      comment: 'Approved for dispatch',
      details: { qty: 400, from: 'TN-CHC-003', to: 'TN-PHC-014', drug_code: 'ORS' },
    },
    {
      audit_id: 'AUD-001202',
      ts: '2026-09-29T06:35:00Z',
      actor: 'dho.d01',
      role: 'DISTRICT',
      action: 'OPTIMIZE_RUN',
      entity_type: 'TRANSFER',
      entity_id: 'RUN-000031',
      comment: null,
      details: { district_id: 'TN-D01', proposals_generated: 2 },
    },
    {
      audit_id: 'AUD-001201',
      ts: '2026-09-29T06:30:00Z',
      actor: 'meenachi.dev',
      role: 'AUDITOR',
      action: 'COPILOT_QUERY',
      entity_type: 'QUERY',
      entity_id: 'Q-000217',
      comment: 'Which PHCs in my district run out of ORS in 10 days?',
      details: { views_accessed: ['v_risk_current'] },
    },
  ],
  next_cursor: null,
};

export async function listAudit(
  params: ListAuditParams = {},
  headers: Record<string, string> = {}
): Promise<AuditList> {
  return fetchApi<AuditList>(
    '/audit',
    { params, headers },
    () => {
      let filtered = [...SAMPLE_AUDIT_ENTRIES.items];
      if (params.actor) {
        filtered = filtered.filter((a) => a.actor.toLowerCase().includes(params.actor!.toLowerCase()));
      }
      if (params.action) {
        filtered = filtered.filter((a) => a.action === params.action);
      }
      if (params.entity_type) {
        filtered = filtered.filter((a) => a.entity_type === params.entity_type);
      }
      if (params.entity_id) {
        filtered = filtered.filter((a) => a.entity_id === params.entity_id);
      }
      if (params.limit && params.limit > 0) {
        filtered = filtered.slice(0, params.limit);
      }
      return {
        items: filtered,
        next_cursor: null,
      };
    }
  );
}
