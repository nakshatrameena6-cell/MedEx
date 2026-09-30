import { CopilotAskRequest, CopilotAskResponse } from '../types/api';
import { postApi } from './apiClient';

export async function askCopilot(
  body: CopilotAskRequest,
  headers: Record<string, string> = {}
): Promise<CopilotAskResponse> {
  return postApi<CopilotAskResponse>(
    '/copilot/ask',
    body,
    { headers },
    () => {
      const qLower = body.question.toLowerCase();

      // Check for refusal scenario
      if (qLower.includes('weather for vacation') || qLower.includes('crypto') || qLower.includes('movie')) {
        return {
          query_id: `Q-${Math.floor(100000 + Math.random() * 900000)}`,
          language: body.language || 'en-IN',
          refused: true,
          refusal_reason: 'Question is outside approved MEDEx supply chain views.',
          answer: 'I can only answer questions based on approved operational views: v_risk_current, v_stock_latest, v_forecast_daily, v_transfers, and v_resilience_weekly.',
          sources: [],
          table: null,
        };
      }

      return {
        query_id: `Q-${Math.floor(100000 + Math.random() * 900000)}`,
        language: body.language || 'en-IN',
        refused: false,
        refusal_reason: null,
        answer: `Analysis for "${body.question}": Two facilities in your district are projected to reach critical stock-out thresholds within 10 days. PHC Sample-014 holds 5.1 days of ORS (RED) and PHC Sample-031 holds 8.2 days of Amoxicillin (AMEX/AMBER). Re-allocation proposal T-001 is available in Transfer Review.`,
        sources: [
          { view: 'v_risk_current', as_of: new Date().toISOString() },
          { view: 'v_stock_latest', as_of: new Date().toISOString() },
        ],
        table: {
          columns: ['facility_id', 'facility_name', 'drug_code', 'cover_days', 'status'],
          rows: [
            ['TN-PHC-014', 'PHC Sample-014', 'ORS', 5.1, 'RED'],
            ['TN-PHC-031', 'PHC Sample-031', 'AMOX500', 8.2, 'AMBER'],
          ],
        },
      };
    }
  );
}
