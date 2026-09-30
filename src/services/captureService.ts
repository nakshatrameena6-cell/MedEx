import {
  CaptureConfirmRequest,
  CaptureConfirmResponse,
  CaptureResponse,
  Language,
} from '../types/api';
import { ApiError, postApi, postMultipartApi } from './apiClient';

export interface VoiceCaptureParams {
  audio: Blob | File;
  facility_id: string;
  language?: Language;
}

export interface PhotoCaptureParams {
  image: Blob | File;
  facility_id: string;
}

export async function captureVoice(
  params: VoiceCaptureParams,
  headers: Record<string, string> = {}
): Promise<CaptureResponse> {
  // Client-side 10 MB limit check
  if (params.audio.size > 10 * 1024 * 1024) {
    throw new ApiError(
      413,
      'Audio file is too large. Max allowed size is 10 MB. Please record again.',
      'file_too_large'
    );
  }

  const formData = new FormData();
  formData.append('audio', params.audio);
  formData.append('facility_id', params.facility_id);
  if (params.language) {
    formData.append('language', params.language);
  }

  return postMultipartApi<CaptureResponse>(
    '/capture/voice',
    formData,
    { headers },
    () => ({
      capture_id: `CAP-VOICE-${Date.now().toString().slice(-6)}`,
      facility_id: params.facility_id,
      source: 'voice',
      language: params.language || 'en-IN',
      transcript: 'ORS 120 packets, paracetamol 500 tablets 800',
      confidence_threshold: 0.85,
      rows: [
        {
          row_id: 1,
          drug_heard: 'ORS packets',
          drug_code: 'ORS',
          drug_name: 'Oral Rehydration Salts',
          qty: 120,
          unit: 'sachets',
          batch_no: 'B-1092',
          expiry_date: '2027-04-30',
          confidence: 0.96,
          needs_confirm: false,
        },
        {
          row_id: 2,
          drug_heard: 'paracetamol 500 tablets',
          drug_code: 'PARA500',
          drug_name: 'Paracetamol 500 mg',
          qty: 800,
          unit: 'tablets',
          batch_no: null,
          expiry_date: null,
          confidence: 0.78,
          needs_confirm: true,
        },
      ],
      warnings: [],
    })
  );
}

export async function capturePhoto(
  params: PhotoCaptureParams,
  headers: Record<string, string> = {}
): Promise<CaptureResponse> {
  // Client-side 8 MB limit check
  if (params.image.size > 8 * 1024 * 1024) {
    throw new ApiError(
      413,
      'Image file is too large. Max allowed size is 8 MB. Please capture or select a smaller image.',
      'file_too_large'
    );
  }

  const formData = new FormData();
  formData.append('image', params.image);
  formData.append('facility_id', params.facility_id);

  return postMultipartApi<CaptureResponse>(
    '/capture/photo',
    formData,
    { headers },
    () => ({
      capture_id: `CAP-PHOTO-${Date.now().toString().slice(-6)}`,
      facility_id: params.facility_id,
      source: 'photo',
      language: null,
      transcript: null,
      confidence_threshold: 0.85,
      rows: [
        {
          row_id: 1,
          drug_heard: 'ORS 50g Sachets',
          drug_code: 'ORS',
          drug_name: 'Oral Rehydration Salts',
          qty: 110,
          unit: 'sachets',
          batch_no: 'B2291',
          expiry_date: '2027-03-31',
          confidence: 0.91,
          needs_confirm: false,
        },
        {
          row_id: 2,
          drug_heard: 'Amoxicillin 500mg Strip',
          drug_code: 'AMOX500',
          drug_name: 'Amoxicillin 500mg',
          qty: 350,
          unit: 'capsules',
          batch_no: 'B4412',
          expiry_date: '2026-11-30',
          confidence: 0.72,
          needs_confirm: true,
        },
      ],
      warnings: ['Row 2 confidence 0.72 is below threshold 0.85 and requires confirmation.'],
    })
  );
}

export async function confirmCapture(
  body: CaptureConfirmRequest,
  headers: Record<string, string> = {}
): Promise<CaptureConfirmResponse> {
  return postApi<CaptureConfirmResponse>(
    '/capture/confirm',
    body,
    { headers },
    () => ({
      snapshot_id: `SNAP-${Math.floor(100000 + Math.random() * 900000)}`,
      facility_id: body.facility_id,
      recorded_at: new Date().toISOString(),
      rows_saved: body.rows.length,
      updated_status: body.rows.map((row) => ({
        drug_code: row.drug_code,
        status: row.qty < 150 ? 'RED' : row.qty < 500 ? 'AMBER' : 'GREEN',
        cover_days: Math.round((row.qty / 22) * 10) / 10,
      })),
    })
  );
}
