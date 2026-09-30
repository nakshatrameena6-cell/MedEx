/**
 * MEDEx OpenAPI v1.1.0 TypeScript Definitions
 * Authoritative contracts: openapi.yaml & PRD Section 17
 */

export type Role = 'FACILITY' | 'BLOCK' | 'DISTRICT' | 'STATE' | 'AUDITOR';
export type RiskStatus = 'RED' | 'AMBER' | 'GREEN';
export type FacilityType = 'PHC' | 'CHC' | 'WAREHOUSE';
export type Language = 'en-IN' | 'ta-IN' | 'hi-IN';
export type TransferState = 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'IN_TRANSIT' | 'RECEIVED' | 'CLOSED';
export type Decision = 'APPROVE' | 'MODIFY' | 'REJECT' | 'ESCALATE' | 'MARK_DONE';
export type AuditAction = 'CAPTURE_CONFIRM' | 'OPTIMIZE_RUN' | 'TRANSFER_APPROVE' | 'TRANSFER_MODIFY' | 'TRANSFER_REJECT' | 'TRANSFER_ESCALATE' | 'TRANSFER_DONE' | 'COPILOT_QUERY' | 'FEDERATION_ROUND' | 'ALERT_ACK';
export type AuditEntityType = 'FACILITY' | 'CAPTURE' | 'TRANSFER' | 'QUERY' | 'ALERT' | 'MODEL';

export interface Health {
  status: 'ok';
  mock_mode: boolean;
  version: string;
  time: string;
}

export interface CaptureRow {
  row_id: number;
  drug_heard: string;
  drug_code: string | null;
  drug_name?: string | null;
  qty: number;
  unit: string;
  batch_no?: string | null;
  expiry_date?: string | null;
  confidence: number;
  needs_confirm: boolean;
}

export interface CaptureResponse {
  capture_id: string;
  facility_id: string;
  source: 'voice' | 'photo';
  language?: Language | null;
  transcript?: string | null;
  confidence_threshold: number;
  rows: CaptureRow[];
  warnings: string[];
}

export interface ConfirmedRow {
  drug_code: string;
  qty: number;
  unit: string;
  batch_no?: string | null;
  expiry_date?: string | null;
}

export interface CaptureConfirmRequest {
  capture_id: string;
  facility_id: string;
  rows: ConfirmedRow[];
}

export interface StatusUpdate {
  drug_code: string;
  status: RiskStatus;
  cover_days: number;
}

export interface CaptureConfirmResponse {
  snapshot_id: string;
  facility_id: string;
  recorded_at: string;
  rows_saved: number;
  updated_status: StatusUpdate[];
}

export interface Facility {
  facility_id: string;
  name: string;
  type: FacilityType;
  state_code: string;
  district_id: string;
  block?: string | null;
  lat: number;
  lng: number;
  population_served?: number | null;
  vulnerability_weight?: number;
  status: RiskStatus;
  last_report_at?: string | null;
}

export interface FacilityList {
  as_of: string;
  items: Facility[];
}

export interface StockItem {
  drug_code: string;
  drug_name: string;
  unit: string;
  stock_qty: number;
  usable_qty: number;
  nearest_expiry?: string | null;
  cover_days: number;
  status: RiskStatus;
  last_updated_at?: string | null;
}

export interface FacilityStatus {
  as_of: string;
  facility: Facility;
  stock: StockItem[];
  beds: { total: number; occupied: number; occupancy_pct: number };
  attendance: { date: string; sanctioned: number; present: number; present_pct: number };
  open_alerts: number;
}

export interface ForecastPoint {
  date: string;
  p10: number;
  p50: number;
  p90: number;
}

export interface ForecastDriver {
  name: string;
  direction: 'up' | 'down';
  contribution_pct: number;
}

export interface ForecastResponse {
  facility_id: string;
  drug_code: string;
  unit: string;
  horizon_weeks: number;
  model_version: string;
  model_scope: 'federated' | 'local';
  generated_at: string;
  history: Array<{ date: string; qty: number }>;
  points: ForecastPoint[];
  drivers: ForecastDriver[];
}

export interface RiskItem {
  facility_id: string;
  facility_name: string;
  district_id: string;
  block?: string | null;
  lat: number;
  lng: number;
  drug_code: string;
  drug_name: string;
  unit: string;
  stock_qty: number;
  cover_days: number;
  cover_days_p90?: number;
  lead_time_days: number;
  safety_buffer_days?: number;
  status: RiskStatus;
  p_stockout: number;
  drug_criticality?: number;
  vulnerability_weight?: number;
  priority: number;
  exposure_units?: number;
  reason: string;
  flags?: Array<{ code: string; reason: string }>;
  as_of: string;
}

export interface RiskResponse {
  district_id: string;
  as_of: string;
  resilience: {
    score: number;
    previous_week_score: number;
    delta: number;
    drift_alert: boolean;
  };
  items: RiskItem[];
}

export interface TransferParty {
  facility_id: string;
  name: string;
  lat: number;
  lng: number;
  district_id: string;
  cover_days_before: number;
  cover_days_after: number;
}

export interface Transfer {
  transfer_id: string;
  run_id: string;
  rank: number;
  state: TransferState;
  drug_code: string;
  drug_name: string;
  unit: string;
  qty: number;
  from: TransferParty;
  to: TransferParty;
  eta_hours: number;
  distance_km: number;
  cost_inr: number;
  batch_expiry_date?: string | null;
  expiry_ok: boolean;
  cross_state: boolean;
  route: {
    polyline: string;
    duration_min: number;
  };
  reason: string;
  created_at: string;
  updated_at: string;
  decided_by?: string | null;
  decision_comment?: string | null;
}

export interface OptimizeRequest {
  district_id: string;
  drug_code?: string | null;
  emergency_mode?: boolean;
  allow_cross_state?: boolean;
  blocked_facility_ids?: string[];
  max_proposals?: number;
}

export interface OptimizeResponse {
  run_id: string;
  generated_at: string;
  solver: { status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE'; objective_value?: number | null };
  proposals: Transfer[];
}

export interface TransferList {
  items: Transfer[];
}

export interface TransferDecisionRequest {
  decision: Decision;
  comment?: string;
  modified_qty?: number;
  modified_source_facility_id?: string;
}


export interface CopilotAskRequest {
  question: string;
  language?: Language;
}

export interface CopilotAskResponse {
  query_id: string;
  language: Language;
  refused: boolean;
  refusal_reason?: string | null;
  answer: string;
  sources: Array<{ view: string; as_of: string }>;
  table?: { columns: string[]; rows: any[][] } | null;
}

export interface ScenarioRequest {
  prompt: string;
  district_id: string;
  horizon_weeks?: number;
}


export interface ScenarioResponse {
  scenario_id: string;
  parsed: { disease: string; affected_blocks: string[]; uplift_pct: number; duration_weeks: number };
  summary: { facilities_red_before: number; facilities_red_after: number };
  burn_down: Array<{
    drug_code: string;
    unit: string;
    points: Array<{ date: string; baseline_stock: number; scenario_stock: number }>;
  }>;
  at_risk: Array<{
    facility_id: string;
    drug_code: string;
    cover_days_baseline: number;
    cover_days_scenario: number;
    status_scenario: RiskStatus;
  }>;
  suggested_optimize_request?: any;
}

export interface FederationRound {
  round_id: string;
  round_number: number;
  status: 'COMPLETED' | 'FAILED';
  model_version: string;
  started_at: string;
  completed_at?: string | null;
  global_mape?: number | null;
  per_state: Array<{
    state_code: string;
    n_samples: number;
    is_data_sparse: boolean;
    local_only_mape: number;
    federated_mape: number;
    update_norm?: number;
  }>;
}

export interface FederationRoundList {
  rounds: FederationRound[];
  models: Array<{ version: string; created_at: string; validated: boolean; active: boolean }>;
}

export interface Alert {
  alert_id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  rule_id: string;
  facility_id: string;
  facility_name: string;
  drug_code?: string | null;
  message: string;
  language: Language;
  audio_url?: string | null;
  escalation_level: 'PHC' | 'BLOCK' | 'DISTRICT' | 'STATE';
  acknowledged: boolean;
  created_at: string;
}

export interface AlertList {
  items: Alert[];
}


export interface AuditEntry {
  audit_id: string;
  ts: string;
  actor: string;
  role: Role;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  comment?: string | null;
  details?: Record<string, any>;
}

export interface AuditList {
  items: AuditEntry[];
  next_cursor?: string | null;
}

export interface ErrorEnvelope {
  error: 'validation_error' | 'constraint_violation' | 'unparseable_scenario' | 'file_too_large' | 'forbidden' | 'not_found' | 'invalid_transition' | 'upstream_unavailable' | 'internal_error';
  message: string;
  details?: Record<string, any> | null;
  request_id?: string;
}
