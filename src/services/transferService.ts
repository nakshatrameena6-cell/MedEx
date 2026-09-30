import {
  OptimizeRequest,
  OptimizeResponse,
  Transfer,
  TransferDecisionRequest,
  TransferList,
  TransferState,
} from '../types/api';
import { ApiError, fetchApi, postApi } from './apiClient';

export interface ListTransfersParams {
  district_id?: string;
  state?: TransferState;
  limit?: number;
}

const SAMPLE_TRANSFERS: Transfer[] = [
  {
    transfer_id: 'T-001',
    run_id: 'RUN-000031',
    rank: 1,
    state: 'OPEN',
    drug_code: 'ORS',
    drug_name: 'Oral Rehydration Salts',
    unit: 'sachets',
    qty: 400,
    from: {
      facility_id: 'TN-CHC-003',
      name: 'CHC Sample-003',
      lat: 10.812,
      lng: 78.688,
      district_id: 'TN-D01',
      cover_days_before: 42.0,
      cover_days_after: 16.0,
    },
    to: {
      facility_id: 'TN-PHC-014',
      name: 'PHC Sample-014',
      lat: 10.792,
      lng: 78.704,
      district_id: 'TN-D01',
      cover_days_before: 5.1,
      cover_days_after: 21.0,
    },
    eta_hours: 1.2,
    distance_km: 38.4,
    cost_inr: 2400,
    batch_expiry_date: '2027-03-31',
    expiry_ok: true,
    cross_state: false,
    route: {
      // Valid Encoded Polyline connecting CHC Sample-003 to PHC Sample-014
      polyline: '_p~iF~ps|U_ulLnnqC_g`A~vhC',
      duration_min: 55,
    },
    reason:
      'TN-CHC-003 holds 42 days of ORS stock and retains 16.0 days post-transfer (safely above the 14-day donor floor). TN-PHC-014 receives 400 sachets, lifting its critical 5.1-day cover to 21.0 days.',
    created_at: '2026-09-29T06:35:00Z',
    updated_at: '2026-09-29T06:35:00Z',
    decided_by: null,
    decision_comment: null,
  },
  {
    transfer_id: 'T-002',
    run_id: 'RUN-000031',
    rank: 2,
    state: 'OPEN',
    drug_code: 'PARA500',
    drug_name: 'Paracetamol 500 mg',
    unit: 'tablets',
    qty: 600,
    from: {
      facility_id: 'TN-CHC-003',
      name: 'CHC Sample-003',
      lat: 10.812,
      lng: 78.688,
      district_id: 'TN-D01',
      cover_days_before: 35.0,
      cover_days_after: 18.0,
    },
    to: {
      facility_id: 'TN-PHC-042',
      name: 'PHC Sample-042',
      lat: 10.871,
      lng: 78.815,
      district_id: 'TN-D01',
      cover_days_before: 6.8,
      cover_days_after: 24.5,
    },
    eta_hours: 1.5,
    distance_km: 42.1,
    cost_inr: 2800,
    batch_expiry_date: '2027-08-31',
    expiry_ok: true,
    cross_state: false,
    route: {
      polyline: '_p~iF~ps|Us{A_uhA_aC_gA',
      duration_min: 68,
    },
    reason:
      'TN-CHC-003 maintains 18.0 days cover after transferring 600 tablets. TN-PHC-042 rises from 6.8 days to 24.5 days, mitigating the active dengue cluster signal.',
    created_at: '2026-09-29T06:35:00Z',
    updated_at: '2026-09-29T06:35:00Z',
    decided_by: null,
    decision_comment: null,
  },
];

let transferStateMemory: Transfer[] = [...SAMPLE_TRANSFERS];

export async function runOptimizer(
  body: OptimizeRequest,
  headers: Record<string, string> = {}
): Promise<OptimizeResponse> {
  // Validate emergency_mode vs allow_cross_state per contract constraint
  if (body.allow_cross_state && !body.emergency_mode) {
    throw new ApiError(
      422,
      'allow_cross_state is only accepted when emergency_mode is true.',
      'validation_error'
    );
  }

  return postApi<OptimizeResponse>(
    '/optimize',
    body,
    { headers },
    () => {
      const runId = `RUN-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedAt = new Date().toISOString();

      let activeProposals = transferStateMemory.filter((t) => {
        if (body.drug_code && t.drug_code !== body.drug_code) return false;
        if (
          body.blocked_facility_ids &&
          (body.blocked_facility_ids.includes(t.from.facility_id) ||
            body.blocked_facility_ids.includes(t.to.facility_id))
        ) {
          return false;
        }
        return true;
      });

      if (activeProposals.length === 0) {
        return {
          run_id: runId,
          generated_at: generatedAt,
          solver: { status: 'INFEASIBLE', objective_value: null },
          proposals: [],
        };
      }

      if (body.max_proposals && body.max_proposals > 0) {
        activeProposals = activeProposals.slice(0, body.max_proposals);
      }

      return {
        run_id: runId,
        generated_at: generatedAt,
        solver: { status: 'OPTIMAL', objective_value: 1834.5 },
        proposals: activeProposals.map((p, idx) => ({
          ...p,
          run_id: runId,
          rank: idx + 1,
          state: 'OPEN',
          created_at: generatedAt,
          updated_at: generatedAt,
        })),
      };
    }
  );
}

export async function listTransfers(
  params: ListTransfersParams = {},
  headers: Record<string, string> = {}
): Promise<TransferList> {
  return fetchApi<TransferList>(
    '/transfers',
    { params, headers },
    () => {
      let filtered = [...transferStateMemory];
      if (params.state) {
        filtered = filtered.filter((t) => t.state === params.state);
      }
      if (params.district_id && params.district_id !== 'ALL') {
        filtered = filtered.filter(
          (t) => t.from.district_id === params.district_id || t.to.district_id === params.district_id
        );
      }
      if (params.limit && params.limit > 0) {
        filtered = filtered.slice(0, params.limit);
      }
      return { items: filtered };
    }
  );
}

export async function decideTransfer(
  transferId: string,
  body: TransferDecisionRequest,
  headers: Record<string, string> = {}
): Promise<Transfer> {
  // Client-side rule check per OpenAPI spec
  if (body.decision === 'REJECT' && (!body.comment || !body.comment.trim())) {
    throw new ApiError(
      422,
      'comment is required for REJECT',
      'validation_error',
      { field: 'comment' }
    );
  }

  return postApi<Transfer>(
    `/transfers/${transferId}/decision`,
    body,
    { headers },
    () => {
      const idx = transferStateMemory.findIndex((t) => t.transfer_id === transferId);
      if (idx === -1) {
        throw new ApiError(404, `Transfer ${transferId} not found`, 'not_found');
      }

      const current = transferStateMemory[idx];

      // Validate transitions according to OpenAPI contract
      let newState: TransferState = current.state;
      if (body.decision === 'APPROVE') {
        if (!['OPEN', 'UNDER_REVIEW', 'ESCALATED'].includes(current.state)) {
          throw new ApiError(
            409,
            `Cannot APPROVE transfer in state ${current.state}`,
            'invalid_transition',
            { state: current.state }
          );
        }
        newState = 'APPROVED';
      } else if (body.decision === 'MODIFY') {
        if (!['OPEN', 'UNDER_REVIEW'].includes(current.state)) {
          throw new ApiError(
            409,
            `Cannot MODIFY transfer in state ${current.state}`,
            'invalid_transition',
            { state: current.state }
          );
        }
        newState = 'APPROVED';
      } else if (body.decision === 'REJECT') {
        if (!['OPEN', 'UNDER_REVIEW', 'ESCALATED'].includes(current.state)) {
          throw new ApiError(
            409,
            `Cannot REJECT transfer in state ${current.state}`,
            'invalid_transition',
            { state: current.state }
          );
        }
        newState = 'REJECTED';
      } else if (body.decision === 'ESCALATE') {
        if (!['OPEN', 'UNDER_REVIEW'].includes(current.state)) {
          throw new ApiError(
            409,
            `Cannot ESCALATE transfer in state ${current.state}`,
            'invalid_transition',
            { state: current.state }
          );
        }
        newState = 'ESCALATED';
      } else if (body.decision === 'MARK_DONE') {
        if (!['APPROVED', 'IN_TRANSIT'].includes(current.state)) {
          throw new ApiError(
            409,
            `Cannot MARK_DONE transfer in state ${current.state}`,
            'invalid_transition',
            { state: current.state }
          );
        }
        newState = 'CLOSED';
      }

      const updated: Transfer = {
        ...current,
        state: newState,
        qty: body.modified_qty ? body.modified_qty : current.qty,
        decided_by: headers['X-User'] || 'dho.d01',
        decision_comment: body.comment || null,
        updated_at: new Date().toISOString(),
      };

      transferStateMemory[idx] = updated;
      return updated;
    }
  );
}
