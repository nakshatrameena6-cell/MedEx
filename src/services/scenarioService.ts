import { ScenarioRequest, ScenarioResponse } from '../types/api';
import { postApi } from './apiClient';

export async function runScenario(
  body: ScenarioRequest,
  headers: Record<string, string> = {}
): Promise<ScenarioResponse> {
  return postApi<ScenarioResponse>(
    '/scenario/run',
    body,
    { headers },
    () => {
      const today = new Date();
      const points = Array.from({ length: 4 }).map((_, idx) => {
        const d = new Date(today);
        d.setDate(d.getDate() + idx * 7);
        const dateStr = d.toISOString().split('T')[0];
        const baseStock = 18200 - idx * 2500;
        const scenStock = 18200 - idx * 4200;
        return {
          date: dateStr,
          baseline_stock: Math.max(0, baseStock),
          scenario_stock: Math.max(0, scenStock),
        };
      });

      return {
        scenario_id: `SCN-${Math.floor(100000 + Math.random() * 900000)}`,
        parsed: {
          disease: body.prompt.toLowerCase().includes('cholera') ? 'cholera' : 'dengue',
          affected_blocks: ['Block-A', 'Block-B', 'Block-C'],
          uplift_pct: 45.0,
          duration_weeks: body.horizon_weeks || 4,
        },
        summary: {
          facilities_red_before: 3,
          facilities_red_after: 9,
        },
        burn_down: [
          {
            drug_code: 'PARA500',
            unit: 'tablets',
            points: points,
          },
          {
            drug_code: 'ORS',
            unit: 'sachets',
            points: points.map((p) => ({
              ...p,
              baseline_stock: Math.round(p.baseline_stock * 0.4),
              scenario_stock: Math.round(p.scenario_stock * 0.25),
            })),
          },
        ],
        at_risk: [
          {
            facility_id: 'TN-PHC-014',
            drug_code: 'PARA500',
            cover_days_baseline: 41.0,
            cover_days_scenario: 18.2,
            status_scenario: 'AMBER',
          },
          {
            facility_id: 'TN-PHC-021',
            drug_code: 'ORS',
            cover_days_baseline: 12.5,
            cover_days_scenario: 4.1,
            status_scenario: 'RED',
          },
          {
            facility_id: 'TN-PHC-042',
            drug_code: 'PARA500',
            cover_days_baseline: 6.8,
            cover_days_scenario: 2.1,
            status_scenario: 'RED',
          },
        ],
        suggested_optimize_request: {
          district_id: body.district_id,
          drug_code: 'PARA500',
          emergency_mode: true,
          allow_cross_state: false,
          blocked_facility_ids: [],
          max_proposals: 5,
        },
      };
    }
  );
}
