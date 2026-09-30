import { ForecastResponse } from '../types/api';
import { fetchApi } from './apiClient';

export interface GetForecastParams {
  facility_id: string;
  drug_code: string;
  horizon_weeks?: number; // 2 to 8, default 4
}

const FIXTURE_FORECAST: Record<string, ForecastResponse> = {
  'TN-PHC-014:ORS': {
    facility_id: 'TN-PHC-014',
    drug_code: 'ORS',
    unit: 'sachets',
    horizon_weeks: 4,
    model_version: 'fed-v7',
    model_scope: 'federated',
    generated_at: '2026-09-29T06:00:00Z',
    history: [
      { date: '2026-09-01', qty: 18 },
      { date: '2026-09-02', qty: 20 },
      { date: '2026-09-03', qty: 22 },
      { date: '2026-09-04', qty: 19 },
      { date: '2026-09-05', qty: 21 },
      { date: '2026-09-06', qty: 23 },
      { date: '2026-09-07', qty: 25 },
      { date: '2026-09-08', qty: 22 },
      { date: '2026-09-09', qty: 24 },
      { date: '2026-09-10', qty: 26 },
      { date: '2026-09-11', qty: 21 },
      { date: '2026-09-12', qty: 23 },
      { date: '2026-09-13', qty: 25 },
      { date: '2026-09-14', qty: 27 },
      { date: '2026-09-15', qty: 24 },
      { date: '2026-09-16', qty: 22 },
      { date: '2026-09-17', qty: 26 },
      { date: '2026-09-18', qty: 28 },
      { date: '2026-09-19', qty: 25 },
      { date: '2026-09-20', qty: 23 },
      { date: '2026-09-21', qty: 27 },
      { date: '2026-09-22', qty: 29 },
      { date: '2026-09-23', qty: 26 },
      { date: '2026-09-24', qty: 24 },
      { date: '2026-09-25', qty: 28 },
      { date: '2026-09-26', qty: 30 },
      { date: '2026-09-27', qty: 21 },
      { date: '2026-09-28', qty: 24 },
    ],
    points: [
      { date: '2026-09-30', p10: 18, p50: 24, p90: 33 },
      { date: '2026-10-01', p10: 19, p50: 26, p90: 36 },
      { date: '2026-10-02', p10: 20, p50: 27, p90: 38 },
      { date: '2026-10-03', p10: 21, p50: 28, p90: 39 },
      { date: '2026-10-04', p10: 22, p50: 30, p90: 41 },
      { date: '2026-10-05', p10: 23, p50: 31, p90: 43 },
      { date: '2026-10-06', p10: 24, p50: 33, p90: 45 },
      { date: '2026-10-07', p10: 25, p50: 34, p90: 46 },
      { date: '2026-10-08', p10: 26, p50: 35, p90: 48 },
      { date: '2026-10-09', p10: 27, p50: 37, p90: 50 },
      { date: '2026-10-10', p10: 28, p50: 38, p90: 52 },
      { date: '2026-10-11', p10: 29, p50: 40, p90: 54 },
      { date: '2026-10-12', p10: 30, p50: 41, p90: 55 },
      { date: '2026-10-13', p10: 31, p50: 42, p90: 57 },
    ],
    drivers: [
      { name: 'rainfall_7d', direction: 'up', contribution_pct: 38 },
      { name: 'dengue_signal', direction: 'up', contribution_pct: 24 },
      { name: 'seasonality', direction: 'up', contribution_pct: 18 },
    ],
  },
};

export async function getForecast(
  params: GetForecastParams,
  headers: Record<string, string> = {}
): Promise<ForecastResponse> {
  return fetchApi<ForecastResponse>(
    '/forecast',
    { params, headers },
    () => {
      const key = `${params.facility_id}:${params.drug_code}`;
      const fixture = FIXTURE_FORECAST[key];

      if (fixture) {
        return {
          ...fixture,
          horizon_weeks: params.horizon_weeks || 4,
        };
      }

      // Fallback generator for other facility:drug combinations
      const horizon = params.horizon_weeks || 4;
      const historyPoints = Array.from({ length: 28 }).map((_, i) => {
        const d = new Date(2026, 8, 1 + i);
        return {
          date: d.toISOString().split('T')[0],
          qty: Math.floor(15 + Math.random() * 20),
        };
      });

      const forecastPoints = Array.from({ length: horizon * 7 }).map((_, i) => {
        const d = new Date(2026, 8, 29 + i);
        const base = 20 + i * 0.8;
        return {
          date: d.toISOString().split('T')[0],
          p10: Math.round(base * 0.75),
          p50: Math.round(base),
          p90: Math.round(base * 1.4),
        };
      });

      return {
        facility_id: params.facility_id,
        drug_code: params.drug_code,
        unit: params.drug_code === 'PARA500' ? 'tablets' : params.drug_code === 'AMOX500' ? 'capsules' : 'sachets',
        horizon_weeks: horizon,
        model_version: 'fed-v7',
        model_scope: 'federated',
        generated_at: new Date().toISOString(),
        history: historyPoints,
        points: forecastPoints,
        drivers: [
          { name: 'seasonality', direction: 'up', contribution_pct: 42 },
          { name: 'outbreak_risk_index', direction: 'up', contribution_pct: 31 },
          { name: 'historical_trend', direction: 'down', contribution_pct: 12 },
        ],
      };
    }
  );
}
