import { AlertList, Language } from '../types/api';
import { fetchApi } from './apiClient';

export interface ListAlertsParams {
  district_id?: string;
  language?: Language;
  acknowledged?: boolean;
}

const SAMPLE_ALERTS: AlertList = {
  items: [
    {
      alert_id: 'AL-000044',
      severity: 'HIGH',
      rule_id: 'STOCKOUT_RED_ESSENTIAL',
      facility_id: 'TN-PHC-014',
      facility_name: 'PHC Sample-014',
      drug_code: 'ORS',
      message: 'ORS stock at PHC Sample-014 projected to run out in 5.1 days. Redistribution proposal T-001 waiting for DHO approval.',
      language: 'en-IN',
      audio_url: '/api/v1/alerts/AL-000044/audio',
      escalation_level: 'BLOCK',
      acknowledged: false,
      created_at: '2026-09-29T06:31:00Z',
    },
    {
      alert_id: 'AL-000045',
      severity: 'MEDIUM',
      rule_id: 'DENGUE_SURGE_SIGNAL',
      facility_id: 'TN-PHC-042',
      facility_name: 'PHC Sample-042',
      drug_code: 'PARA500',
      message: 'Dengue surge signal detected in Block-B. Paracetamol 500 mg cover down to 6.8 days.',
      language: 'en-IN',
      audio_url: '/api/v1/alerts/AL-000045/audio',
      escalation_level: 'DISTRICT',
      acknowledged: false,
      created_at: '2026-09-29T06:15:00Z',
    },
    {
      alert_id: 'AL-000046',
      severity: 'LOW',
      rule_id: 'EXPIRY_WARNING',
      facility_id: 'TN-CHC-003',
      facility_name: 'CHC Sample-003',
      drug_code: 'AMOX500',
      message: 'Amoxicillin batch B-4412 expiring in 60 days. Redistribution suggested to high-consumption PHCs.',
      language: 'en-IN',
      audio_url: null,
      escalation_level: 'PHC',
      acknowledged: true,
      created_at: '2026-09-29T05:00:00Z',
    },
  ],
};

export async function listAlerts(
  params: ListAlertsParams = {},
  headers: Record<string, string> = {}
): Promise<AlertList> {
  return fetchApi<AlertList>(
    '/alerts',
    { params, headers },
    () => {
      let filtered = [...SAMPLE_ALERTS.items];
      if (params.language) {
        filtered = filtered.map((a) => ({
          ...a,
          language: params.language!,
        }));
      }
      if (params.acknowledged !== undefined) {
        filtered = filtered.filter((a) => a.acknowledged === params.acknowledged);
      }
      return { items: filtered };
    }
  );
}

export function getAlertAudioUrl(alertId: string, isMock: boolean): string {
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  if (isMock) {
    // Return a synthesized web audio data URL / dummy audio sample for realistic offline playback
    return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  }
  return `${baseUrl}/alerts/${alertId}/audio`;
}
