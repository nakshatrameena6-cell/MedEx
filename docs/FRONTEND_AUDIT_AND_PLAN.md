# MEDEx FRONTEND — PHASE 0: CONTRACT & REPOSITORY AUDIT & IMPLEMENTATION PLAN

**Project Name:** MEDEx (UI Branding)  
**Authoritative Contracts:** OpenAPI v1.1.0 (`openapi.yaml`) & Product Requirements Document (`PRD.html`)  
**Frontend Implementation Lead:** Meenachi  
**Backend & Data Lead:** Nattu  
**Date:** September 29, 2026  

---

## Executive Summary & Contract Audit Scope

This document defines the **Phase 0 Architecture & Implementation Plan** for the MEDEx frontend. All design and technical decisions strictly adhere to the contract priority order:
1. **OpenAPI v1.1.0 Contract (`openapi.yaml`)** — Single source of truth for paths, operations, schema identifiers, and HTTP status handling.
2. **Product Requirements Document (`PRD.html`)** — Authoritative source for functional workflows, priority scores, role rules, and mathematical logic.
3. **UI Reference Image** — Directional guidance for visual layout, dark/light themes, and dashboard component styling.
4. **Existing Repository Architecture** — Implementation constraints and project structure.

> [!IMPORTANT]
> **Branding & Naming Integrity:** While the UI is branded **MEDEx**, no backend endpoint paths, schema names, operation IDs, JSON field keys, header names, or role keys are modified. All API calls match `openapi.yaml` exactly.

---

## 1. Existing Repository Audit & Baseline Architecture

### 1.1 Repository State
- **Branch:** `FRONTEND` (checked out from `origin/FRONTEND`).
- **Files Inspected:**
  - `README.md`: Overall platform architecture, intelligence pipeline, redistribution flow, user role overview, and technology stack.
  - `openapi.yaml` (v1.1.0): Complete 1,528-line OpenAPI specification outlining all 17 endpoints, 5 role headers, mock expectations, and data schemas.
  - `PRD.html` (v1.1): Product requirements document specifying P0/P1 scope, priority formulas, risk logic, and user personas.

### 1.2 Technology Stack Strategy
- **Framework:** React 18+ with Vite & TypeScript for fast local development and bundle optimization.
- **Styling & Design System:** Tailwind CSS + Vanilla CSS custom properties for rich dark/light mode aesthetics, glassmorphism, responsive grid layouts, and custom status badge styling.
- **Icons:** Lucide React (`lucide-react`) for clean, modern public-health and UI icons.
- **Routing:** React Router v6 (`react-router-dom`) with layout wrappers and role-based route guards.
- **Mapping:** `@googlemaps/js-api-loader` / Google Maps JS API for interactive PHC marker rendering and polyline route decoding.
- **Charts:** Recharts for forecast confidence bands (P10/P50/P90), driver attributions, federated MAPE comparisons, and scenario burn-down curves.
- **State & Data Fetching:** TanStack React Query (v5) for caching, background refetching, and optimistic updates.

### 1.3 Server Configuration & Mock Mode Integration
- **Base URL:** `/api/v1`
- **Default Local Server:** `http://localhost:8000/api/v1`
- **Production / Staging Server:** `https://REPLACE-AFTER-FIRST-DEPLOY.a.run.app/api/v1` (Cloud Run)
- **Mock Mode Strategy:**
  - When `MOCK_MODE=true` (or when local backend is unreachable), client requests include `X-Mock: true`.
  - The API service layer includes typed fixtures generated directly from `openapi.yaml` example responses, allowing 100% full-screen UX testing prior to live backend deployment.

---

## 2. Role Security Model & Header Architecture

The system enforces row-level security and permission boundaries via three mandatory HTTP headers on every request:
- `X-Role`: `FACILITY` | `BLOCK` | `DISTRICT` | `STATE` | `AUDITOR` *(Note: `NATIONAL` is explicitly excluded).*
- `X-District`: District ID (e.g., `TN-D01`) or `ALL` (for `STATE` and `AUDITOR`).
- `X-User`: User identifier (e.g., `meenachi.dev`, `dho.d01`) logged in the audit trail.

### Role Permission & Screen Access Matrix (from `openapi.yaml`)

| Feature / Screen | `FACILITY` | `BLOCK` | `DISTRICT` | `STATE` | `AUDITOR` |
|---|---|---|---|---|---|
| **PHC Capture** (`/capture`) | Own facility | Own block | Own district | State-wide | Read-only |
| **District Map** (`/map`) | Own facility | Own block | Own district | State-wide (`ALL`) | State-wide (`ALL`) |
| **Risk Queue** (`/risk`) | Own facility | Own block | Own district | State-wide (`ALL`) | State-wide (`ALL`) |
| **Transfer Review** (`/transfers`) | Hide | Own block | Own district | State-wide | Read-only (`ALL`) |
| **Run Optimizer** (`POST /optimize`) | Denied (403) | Own block | Own district | State-wide | Denied (403) |
| **Transfer Decision** (`POST /transfers/{id}/decision`) | Denied (403) | Own block | Own district | State-wide | Denied (403) |
| **Forecast View** (`/forecast`) | Own facility | Own block | Own district | State-wide | Read-only (`ALL`) |
| **Gemini Copilot** (Overlay) | Allowed | Allowed | Allowed | Allowed | Read-only |
| **Scenario Simulator** (`/scenario`) [P1] | Denied (403) | Denied (403) | Own district | State-wide | Denied (403) |
| **Federation Console** (`/federation`) [P0/P1] | Denied (403) | Denied (403) | Denied (403) | State-wide | Read-only (`ALL`) |
| **Multilingual Alerts** (`/alerts`) [P1] | Own facility | Own block | Own district | State-wide | Read-only (`ALL`) |
| **Audit Trail** (`/audit`) [P0/P1] | Denied (403) | Denied (403) | Own district | State-wide | Read-only (`ALL`) |

---

## 3. Frontend Application Routes

The application uses `react-router-dom` with a main app shell `AppLayout` containing navigation, role switcher header, alert counter, and global Gemini Copilot drawer overlay.

```ts
// Route Configuration Hierarchy
/                     -> Redirect to /capture or /map (role-dependent)
/capture              -> PHC Capture (Voice & Photo stock entry + Confirmation step)
/map                  -> District Map (Facilities, status markers, polyline route view)
/risk                 -> Risk Queue (Ranked priority list, stock-out probability, Gemini reasons)
/transfers            -> Transfer Review (Optimizer proposals, decision workflow: Approve/Modify/Reject/Escalate)
/forecast             -> Forecast View (P10/P50/P90 demand bands, driver attributions)
/federation           -> Federation Console (Federated training rounds, global/state MAPE charts)
/scenario             -> Scenario Simulator [P1] (Surge simulation, burn-down comparison, auto-optimize request)
/alerts               -> Multilingual Alerts & Voice Notes [P1] (Severity filters, audio player)
/audit                -> Audit Trail Table (Append-only log viewer, filterable by actor/action/entity)
```

---

## 4. Component Architecture & Hierarchy

```
src/
├── assets/
│   └── branding/              # MEDEx logo & SVG graphics
├── components/
│   ├── common/
│   │   ├── HeaderNavbar.tsx   # MEDEx branding, active role switcher, district selector, mock toggle
│   │   ├── SidebarNav.tsx     # Role-filtered navigation menu
│   │   ├── RiskBadge.tsx      # Standardized RED / AMBER / GREEN status pill
│   │   ├── StatCard.tsx       # KPI stat display with trend indicators
│   │   ├── DataTable.tsx      # Generic paginated, sortable table
│   │   ├── AudioPlayer.tsx    # Audio player component for alert voice notes
│   │   └── Modal.tsx          # Reusable modal container
│   ├── capture/
│   │   ├── VoiceCaptureModal.tsx # WebRTC audio recorder + Speech-to-Text submit
│   │   ├── PhotoCaptureModal.tsx # Image file upload / camera snapshot
│   │   └── ConfirmRowsTable.tsx  # Low-confidence (<0.85) row editor & save trigger
│   ├── map/
│   │   ├── DistrictMap.tsx       # Google Maps / Leaflet interactive map container
│   │   ├── FacilityMarker.tsx    # Custom color-coded status marker
│   │   ├── FacilityDrawer.tsx    # Facility detail side drawer (stock, beds, attendance)
│   │   └── TransferRoutePolyline.tsx # Decoded Google polyline route visualization
│   ├── risk/
│   │   ├── RiskCard.tsx          # At-risk facility summary card with Gemini reason
│   │   └── RiskFilterBar.tsx     # Filter by status (RED/AMBER), drug_code, district
│   ├── transfers/
│   │   ├── ProposalCard.tsx      # Ranked redistribution proposal card
│   │   ├── DecisionModal.tsx     # APPROVE, MODIFY (qty/source), REJECT (comment), ESCALATE modal
│   │   └── RunOptimizerForm.tsx  # Emergency mode & road-cut (blocked facility) toggles
│   ├── forecast/
│   │   ├── ForecastChart.tsx     # Recharts P10/P50/P90 band & 28-day history plot
│   │   └── DriverBreakdown.tsx   # Driver contribution percentages (rainfall, dengue, etc.)
│   ├── copilot/
│   │   ├── CopilotDrawer.tsx     # Slide-over chat panel
│   │   ├── CopilotMessage.tsx    # Answer text, source citations (v_views), & dynamic table output
│   │   └── QuickQuestionPills.tsx# One-click question templates
│   ├── federation/
│   │   ├── FederationChart.tsx   # Local MAPE vs Federated MAPE comparison chart
│   │   ├── RoundHistoryTable.tsx # Round execution history log
│   │   └── RunRoundForm.tsx      # Trigger new training round (epochs, DP noise toggle)
│   ├── scenario/
│   │   ├── ScenarioForm.tsx      # Natural language prompt & horizon selector
│   │   ├── BurnDownChart.tsx     # Baseline vs Scenario stock projection chart
│   │   └── AtRiskImpactTable.tsx # Facilities converted to RED/AMBER under scenario
│   ├── alerts/
│   │   ├── AlertCard.tsx         # Severity-coded alert card with translation badge
│   │   └── AudioVoiceNote.tsx    # Voice note trigger for GET /alerts/{id}/audio
│   └── audit/
│       └── AuditTable.tsx        # Audit trail table with actor, action, entity, details
├── context/
│   ├── AuthRoleContext.tsx       # Manages active role, district ID, user ID, mock mode flag
│   └── CopilotContext.tsx        # Manages copilot drawer state & conversation history
├── services/                     # Typed API client services
│   ├── apiClient.ts              # Axios instance with header injectors & mock mode fallback
│   ├── healthService.ts
│   ├── captureService.ts
│   ├── facilitiesService.ts
│   ├── forecastService.ts
│   ├── riskService.ts
│   ├── redistributionService.ts
│   ├── copilotService.ts
│   ├── scenarioService.ts
│   ├── federationService.ts
│   ├── alertService.ts
│   └── auditService.ts
├── types/
│   └── api.ts                    # Complete TypeScript definitions matching openapi.yaml
└── views/
    ├── CaptureView.tsx
    ├── MapView.tsx
    ├── RiskView.tsx
    ├── TransferView.tsx
    ├── ForecastView.tsx
    ├── FederationView.tsx
    ├── ScenarioView.tsx
    ├── AlertsView.tsx
    └── AuditView.tsx
```

---

## 5. API Services Layer

All network calls are routed through `apiClient.ts`, which injects the contract-defined security headers and handles error envelopes.

```ts
// src/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setSecurityHeaders = (role: string, district: string, user: string, mockMode: boolean) => {
  apiClient.defaults.headers.common['X-Role'] = role;
  apiClient.defaults.headers.common['X-District'] = district;
  apiClient.defaults.headers.common['X-User'] = user;
  if (mockMode) {
    apiClient.defaults.headers.common['X-Mock'] = 'true';
  } else {
    delete apiClient.defaults.headers.common['X-Mock'];
  }
};
```

### Complete Service Method Mappings

| Service File | Method | HTTP Method & Path | OpenAPI operationId |
|---|---|---|---|
| `healthService.ts` | `getHealth()` | `GET /health` | `getHealth` |
| `captureService.ts` | `captureVoice(formData)` | `POST /capture/voice` | `captureVoice` |
| | `capturePhoto(formData)` | `POST /capture/photo` | `capturePhoto` |
| | `confirmCapture(payload)` | `POST /capture/confirm` | `confirmCapture` |
| `facilitiesService.ts`| `listFacilities(params)` | `GET /facilities` | `listFacilities` |
| | `getFacilityStatus(id)` | `GET /facilities/{facility_id}/status` | `getFacilityStatus` |
| `forecastService.ts` | `getForecast(params)` | `GET /forecast` | `getForecast` |
| `riskService.ts` | `getRisk(params)` | `GET /risk` | `getRisk` |
| `redistributionService.ts`| `runOptimizer(payload)`| `POST /optimize` | `runOptimizer` |
| | `listTransfers(params)` | `GET /transfers` | `listTransfers` |
| | `decideTransfer(id, body)`| `POST /transfers/{transfer_id}/decision` | `decideTransfer` |
| `copilotService.ts` | `askCopilot(payload)` | `POST /copilot/ask` | `askCopilot` |
| `scenarioService.ts` | `runScenario(payload)` | `POST /scenario/run` | `runScenario` |
| `federationService.ts` | `runFederationRound(body)`| `POST /federation/round` | `runFederationRound` |
| | `listFederationRounds()`| `GET /federation/rounds` | `listFederationRounds` |
| `alertService.ts` | `listAlerts(params)` | `GET /alerts` | `listAlerts` |
| | `getAlertAudioUrl(id)` | `GET /alerts/{alert_id}/audio` | `getAlertAudio` |
| `auditService.ts` | `listAudit(params)` | `GET /audit` | `listAudit` |

---

## 6. Comprehensive TypeScript Definitions (`src/types/api.ts`)

All TypeScript types strictly reflect `openapi.yaml` schemas:

```ts
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

export interface OptimizeResponse {
  run_id: string;
  generated_at: string;
  solver: { status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE'; objective_value?: number | null };
  proposals: Transfer[];
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
```

---

## 7. Map Architecture (`DistrictMap.tsx`)

The **District Map** is a core operational interface for visualizing healthcare facilities and active redistribution routes across a district.

```
+--------------------------------------------------------------------------------+
| [HeaderNavbar: Role: DISTRICT (TN-D01) | Mock: TRUE | Alerts: (2) ]             |
+--------------------------------------------------------------------------------+
|  MAP CONTROLS                                                                  |
|  Status Filter: [ All ] [ RED (3) ] [ AMBER (8) ] [ GREEN (45) ]              |
|  Drug Filter:   [ All Drugs ] [ ORS ] [ PARA500 ]                              |
+--------------------------------------------------------------------------------+
|                                                                                |
|     (RED Marker: TN-PHC-014)                                                   |
|         \                                                                      |
|          \  === Route Polyline (ETA: 6h | 38.4km) ===                         |
|           \                                                                    |
|         (GREEN Marker: TN-CHC-003)                                             |
|                                                                                |
|  [ Click Marker -> Facility Drawer Opens ]                                     |
+--------------------------------------------------------------------------------+
| FACILITY DETAIL DRAWER (TN-PHC-014)                                            |
| Name: PHC Sample-014 | Type: PHC | Vulnerability Weight: 1.8                   |
| Stock: ORS (120 sachets, 5.1 days cover - RED)                                 |
| Beds: 6/10 Occupied (60%) | Attendance: 6/8 Present (75%)                      |
+--------------------------------------------------------------------------------+
```

### Key Technical Details
1. **Marker Rendering:** Facilities loaded via `GET /facilities` are mapped to Google Maps Markers or custom Leaflet pins color-coded by `status` (Red `#EF4444`, Amber `#F59E0B`, Green `#10B981`).
2. **Polyline Decoding:** When a transfer proposal (`Transfer`) is selected in Transfer Review or Map, `route.polyline` is decoded using `@googlemaps/polyline-codec` or `google.maps.geometry.encoding.decodePath(polyline)` and rendered as a dashed SVG line over the road network.
3. **Facility Drawer Integration:** Clicking a marker triggers `GET /facilities/{facility_id}/status`, populating the side drawer with stock balances, nearest expiry dates, bed occupancy %, staff attendance, and open alerts.

---

## 8. Chart Architecture

### 8.1 Demand Forecast Chart (`ForecastChart.tsx`)
- **Data Source:** `GET /forecast?facility_id={id}&drug_code={code}`
- **Chart Type:** Recharts `ComposedChart` combining line and area series.
- **Visual Structure:**
  - **Historical actuals:** Solid blue line for the past 28 days (`history`).
  - **Uncertainty Corridor:** Shaded light blue band spanning from `p10` (lower boundary) to `p90` (upper boundary).
  - **Median Projection:** Bold line for `p50` daily demand.
- **Driver Breakdown Widget:** Bar display showing factor contribution percentages (e.g., `rainfall_7d`: +38%, `dengue_signal`: +24%, `seasonality`: +18%).

### 8.2 Federated Model Performance Chart (`FederationChart.tsx`)
- **Data Source:** `GET /federation/rounds`
- **Chart Type:** Recharts `BarChart` comparing `local_only_mape` vs `federated_mape` grouped by state code (`TN`, `BR`, `MH`).
- **Demo Highlight:** Visual callout badge on sparse-data state node (`is_data_sparse: true`, e.g. Bihar `BR`), demonstrating how federated learning drops MAPE error from 26.5% to 17.9% without cross-state raw data sharing.

### 8.3 Scenario Burn-Down Chart (`BurnDownChart.tsx`)
- **Data Source:** `POST /scenario/run`
- **Chart Type:** Dual-line comparison chart plotting `baseline_stock` vs `scenario_stock` over a 4-week simulation horizon to highlight accelerated stock-out timelines under disease surges.

---

## 9. State Management & Data Flow

- **AuthRoleContext:** Global state holding `{ activeRole, activeDistrict, userId, isMockMode }`. Updates default HTTP headers on change.
- **TanStack React Query:** Handles server cache, auto-invalidation, loading states, and error handling.
  - Confirming stock (`POST /capture/confirm`) automatically invalidates `/facilities`, `/risk`, and `/facilities/{id}/status` queries.
  - Making a transfer decision (`POST /transfers/{id}/decision`) automatically invalidates `/transfers` and `/audit` queries.
- **CopilotDrawer State:** Manages slide-over drawer visibility, conversation log, query execution status, and structured table output.

---

## 10. Reusable UI Design System & Component Guidelines

To deliver a **stunning, state-of-the-art UI** that wows the user, the frontend uses a curated theme palette and high-end micro-interactions:

### 10.1 Color Palette & Theme Tokens
- **Backgrounds:** Dark Mode `#0F172A` (Slate 900) / Light Mode `#F8FAFC` (Slate 50).
- **Surface & Cards:** Glassmorphism slate backdrop `#1E293B` with subtle border `rgba(255, 255, 255, 0.1)`.
- **Primary Brand Accent:** Vibrant Health Cyan `#06B6D4` / Electric Indigo `#6366F1`.
- **Status Badges:**
  - **RED (Stockout Risk / Critical):** `#EF4444` background with light red text.
  - **AMBER (Low Stock Warning):** `#F59E0B` background with warm yellow text.
  - **GREEN (Normal Cover):** `#10B981` background with crisp emerald text.

### 10.2 Reusable UI Components
1. `HeaderNavbar`: Features MEDEx logo, active role dropdown, district selector pill, mock indicator badge, and alert counter button.
2. `RiskBadge`: Standardized status pill component displaying RED/AMBER/GREEN and cover days.
3. `StatCard`: Displays numeric metrics, icon, and week-over-week delta badges.
4. `DataTable`: Generic accessible table with sortable columns, row highlights, and pagination controls.
5. `VoiceRecorderModal`: Audio recording visualizer (waveform animation), timer, and submission pipeline.
6. `TransferDecisionModal`: Interactive modal for approving, modifying quantity/source, or rejecting proposals with required reason comments.
7. `CopilotDrawer`: Persistent slide-over assistant drawer with pre-built quick prompt chips.

---

## 11. Phase 1 Execution Roadmap (Next Steps)

With Phase 0 Contract & Repository Audit complete, implementation will proceed according to the following phased milestones:

1. **Milestone 1: Project Setup & Core SDK**
   - Initialize Vite + React + TS structure.
   - Configure Tailwind CSS, design tokens, and glassmorphism utilities.
   - Build `src/types/api.ts`, `apiClient.ts`, and full fixture mocks for all 17 OpenAPI endpoints.

2. **Milestone 2: App Shell & Role Architecture**
   - Implement `AuthRoleContext`, header navbar, role switcher, district selector, and mock mode toggle.
   - Implement sidebar navigation and global `CopilotDrawer`.

3. **Milestone 3: Core P0 Operational Screens**
   - **PHC Capture:** Voice recorder, photo uploader, confidence check table, `POST /capture/confirm`.
   - **District Map:** Marker color coding, polyline route renderer, facility status drawer.
   - **Risk Queue:** Ranked risk list, priority formula display, stockout probability badges.
   - **Transfer Review:** Redistribution proposal list, decision modals (Approve/Modify/Reject/Escalate), optimizer triggers.
   - **Forecast View:** P10/P50/P90 demand band chart, driver contribution breakdown.

4. **Milestone 4: P1 Intelligence & Governance Screens**
   - **Scenario Simulator:** Emergency surge prompt handler, burn-down comparison chart.
   - **Federation Console:** Federated round trigger, state MAPE comparison chart.
   - **Multilingual Alerts & Voice Notes:** Translated alert cards, TTS audio player.
   - **Audit Trail:** Append-only event log viewer.

---

**AUDIT COMPLETE.**  
*Ready for user sign-off prior to Phase 1 frontend implementation.*
