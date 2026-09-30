import { RiskResponse, RiskStatus } from '../types/api';
import { fetchApi } from './apiClient';

export interface GetRiskParams {
  district_id?: string;
  drug_code?: string;
  status?: RiskStatus;
  limit?: number;
}

const FIXTURE_RISK_RESPONSE: RiskResponse = {
  district_id: 'TN-D01',
  as_of: '2026-09-29T06:30:00Z',
  resilience: {
    score: 71,
    previous_week_score: 78,
    delta: -7,
    drift_alert: true,
  },
  items: [
    {
      facility_id: 'TN-PHC-014',
      facility_name: 'PHC Sample-014',
      district_id: 'TN-D01',
      block: 'Block-A',
      lat: 10.792,
      lng: 78.704,
      drug_code: 'ORS',
      drug_name: 'Oral Rehydration Salts',
      unit: 'sachets',
      stock_qty: 120,
      cover_days: 5.1,
      cover_days_p90: 3.6,
      lead_time_days: 9,
      safety_buffer_days: 3,
      status: 'RED',
      p_stockout: 0.82,
      drug_criticality: 4,
      vulnerability_weight: 1.8,
      priority: 0.91,
      exposure_units: 96,
      reason: 'ORS is projected to run out in about 5 days, before the next delivery arrives in 9 days. Demand is rising after heavy rain.',
      flags: [{ code: 'DEMAND_SPIKE', reason: 'High rainfall event signal' }],
      as_of: '2026-09-29T06:30:00Z',
    },
    {
      facility_id: 'TN-PHC-042',
      facility_name: 'PHC Sample-042',
      district_id: 'TN-D01',
      block: 'Block-B',
      lat: 10.871,
      lng: 78.815,
      drug_code: 'PARA500',
      drug_name: 'Paracetamol 500 mg',
      unit: 'tablets',
      stock_qty: 450,
      cover_days: 6.8,
      cover_days_p90: 4.5,
      lead_time_days: 10,
      safety_buffer_days: 3,
      status: 'RED',
      p_stockout: 0.76,
      drug_criticality: 3,
      vulnerability_weight: 1.9,
      priority: 0.84,
      exposure_units: 350,
      reason: 'Paracetamol stock is below lead time cover threshold. Dengue surge signal active in neighboring blocks.',
      flags: [{ code: 'DENGUE_SURGE', reason: 'Outbreak indicator active' }],
      as_of: '2026-09-29T06:30:00Z',
    },
    {
      facility_id: 'TN-CHC-003',
      facility_name: 'CHC Sample-003',
      district_id: 'TN-D01',
      block: 'Block-A',
      lat: 10.812,
      lng: 78.688,
      drug_code: 'PARA500',
      drug_name: 'Paracetamol 500 mg',
      unit: 'tablets',
      stock_qty: 1200,
      cover_days: 14.5,
      cover_days_p90: 10.2,
      lead_time_days: 10,
      safety_buffer_days: 3,
      status: 'AMBER',
      p_stockout: 0.42,
      drug_criticality: 3,
      vulnerability_weight: 1.2,
      priority: 0.58,
      exposure_units: 0,
      reason: 'Paracetamol cover is below 2x lead time (14.5 days). Donor buffer available for redistribution.',
      flags: [],
      as_of: '2026-09-29T06:30:00Z',
    },
    {
      facility_id: 'TN-PHC-031',
      facility_name: 'PHC Sample-031',
      district_id: 'TN-D01',
      block: 'Block-C',
      lat: 10.745,
      lng: 78.631,
      drug_code: 'AMOX500',
      drug_name: 'Amoxicillin 500mg',
      unit: 'capsules',
      stock_qty: 280,
      cover_days: 12.0,
      cover_days_p90: 8.5,
      lead_time_days: 8,
      safety_buffer_days: 3,
      status: 'AMBER',
      p_stockout: 0.38,
      drug_criticality: 4,
      vulnerability_weight: 1.5,
      priority: 0.52,
      exposure_units: 0,
      reason: 'Amoxicillin cover is 12 days, under 2x lead time threshold.',
      flags: [],
      as_of: '2026-09-29T06:30:00Z',
    },
  ],
};

export async function getRisk(
  params: GetRiskParams = {},
  headers: Record<string, string> = {}
): Promise<RiskResponse> {
  return fetchApi<RiskResponse>(
    '/risk',
    { params, headers },
    () => {
      let filteredItems = [...FIXTURE_RISK_RESPONSE.items];

      if (params.district_id && params.district_id !== 'ALL') {
        filteredItems = filteredItems.filter((item) => item.district_id === params.district_id);
      }
      if (params.drug_code) {
        filteredItems = filteredItems.filter((item) => item.drug_code === params.drug_code);
      }
      if (params.status) {
        filteredItems = filteredItems.filter((item) => item.status === params.status);
      }
      if (params.limit && params.limit > 0) {
        filteredItems = filteredItems.slice(0, params.limit);
      }

      return {
        ...FIXTURE_RISK_RESPONSE,
        items: filteredItems,
      };
    }
  );
}
