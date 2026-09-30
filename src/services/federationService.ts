import { FederationRound, FederationRoundList } from '../types/api';
import { fetchApi } from './apiClient';

export interface RunFederationRoundRequest {
  state_codes?: string[];
  local_epochs?: number; // 1 to 10, default 3
  dp_noise?: boolean; // default false
}

const FIXTURE_FEDERATION_LIST: FederationRoundList = {
  rounds: [
    {
      round_id: 'FR-0007',
      round_number: 7,
      status: 'COMPLETED',
      model_version: 'fed-v7',
      started_at: '2026-09-29T06:20:00Z',
      completed_at: '2026-09-29T06:20:06Z',
      global_mape: 14.9,
      per_state: [
        {
          state_code: 'TN',
          n_samples: 52000,
          is_data_sparse: false,
          local_only_mape: 13.1,
          federated_mape: 13.0,
          update_norm: 0.44,
        },
        {
          state_code: 'BR',
          n_samples: 9000,
          is_data_sparse: true,
          local_only_mape: 26.5,
          federated_mape: 19.4,
          update_norm: 0.66,
        },
        {
          state_code: 'MH',
          n_samples: 41000,
          is_data_sparse: false,
          local_only_mape: 14.4,
          federated_mape: 14.0,
          update_norm: 0.49,
        },
      ],
    },
    {
      round_id: 'FR-0006',
      round_number: 6,
      status: 'COMPLETED',
      model_version: 'fed-v6',
      started_at: '2026-09-29T06:05:00Z',
      completed_at: '2026-09-29T06:05:04Z',
      global_mape: 15.6,
      per_state: [
        {
          state_code: 'TN',
          n_samples: 52000,
          is_data_sparse: false,
          local_only_mape: 13.5,
          federated_mape: 13.2,
          update_norm: 0.48,
        },
        {
          state_code: 'BR',
          n_samples: 9000,
          is_data_sparse: true,
          local_only_mape: 27.2,
          federated_mape: 21.0,
          update_norm: 0.70,
        },
        {
          state_code: 'MH',
          n_samples: 41000,
          is_data_sparse: false,
          local_only_mape: 15.0,
          federated_mape: 14.5,
          update_norm: 0.52,
        },
      ],
    },
  ],
  models: [
    { version: 'fed-v7', created_at: '2026-09-29T06:20:06Z', validated: true, active: true },
    { version: 'fed-v6', created_at: '2026-09-29T06:05:04Z', validated: true, active: false },
  ],
};

export async function listFederationRounds(
  headers: Record<string, string> = {}
): Promise<FederationRoundList> {
  return fetchApi<FederationRoundList>(
    '/federation/rounds',
    { headers },
    () => FIXTURE_FEDERATION_LIST
  );
}

export async function runFederationRound(
  body: RunFederationRoundRequest,
  headers: Record<string, string> = {}
): Promise<FederationRound> {
  const isMock = headers['X-Mock'] === 'true';

  if (isMock) {
    // Simulate training round latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newRoundNumber = FIXTURE_FEDERATION_LIST.rounds.length + 6;
    const newVersion = `fed-v${newRoundNumber}`;
    const startedAt = new Date().toISOString();
    const completedAt = new Date(Date.now() + 6000).toISOString();

    const newRound: FederationRound = {
      round_id: `FR-000${newRoundNumber}`,
      round_number: newRoundNumber,
      status: 'COMPLETED',
      model_version: newVersion,
      started_at: startedAt,
      completed_at: completedAt,
      global_mape: 14.2,
      per_state: [
        {
          state_code: 'TN',
          n_samples: 52000,
          is_data_sparse: false,
          local_only_mape: 13.1,
          federated_mape: 12.8,
          update_norm: 0.42,
        },
        {
          state_code: 'BR',
          n_samples: 9000,
          is_data_sparse: true,
          local_only_mape: 26.5,
          federated_mape: 17.9,
          update_norm: 0.61,
        },
        {
          state_code: 'MH',
          n_samples: 41000,
          is_data_sparse: false,
          local_only_mape: 14.4,
          federated_mape: 13.6,
          update_norm: 0.47,
        },
      ],
    };

    // Prepend to fixture list
    FIXTURE_FEDERATION_LIST.rounds.unshift(newRound);

    // Update active model
    FIXTURE_FEDERATION_LIST.models.forEach((m) => (m.active = false));
    FIXTURE_FEDERATION_LIST.models.unshift({
      version: newVersion,
      created_at: completedAt,
      validated: true,
      active: true,
    });

    return newRound;
  }

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const response = await fetch(`${baseUrl}/federation/round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.message || `HTTP ${response.status}`);
  }

  return (await response.json()) as FederationRound;
}
