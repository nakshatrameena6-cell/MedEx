# MedEx — Health Supply Chain Resilience Backend (v1.1.0)

Production-grade FastAPI backend for MedEx health-supply-chain analytics, multimodal stock capture, redistribution optimization, Copilot explainability, and scenario simulation.

## Key Features

1. **Multimodal Stock Capture**: Audio & photo stock extraction using Google Gemini AI (`google-generativeai` SDK) with strict `DrugMaster` validation, alias matching, and confidence-based human confirmation.
2. **Deterministic Risk & Forecast Engines**: 28-day historical consumption analysis with P10/P50/P90 confidence bounds, OPD footfall correlation, disease signal uplifts, and PRD-compliant risk priority scores.
3. **Redistribution Optimizer**: Inter-facility transport optimization using Google OR-Tools linear solver with complete human decision workflow (`APPROVE`, `MODIFY`, `REJECT`, `ESCALATE`).
4. **MedEx Copilot & Scenario Simulator**: Gemini-powered explainable AI grounded in ground-truth DB context and isolated hypothetical simulation sandbox.
5. **Federated Learning Demonstration**: Multi-node cross-state aggregation workflow.

---

## Local Setup

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install runtime dependencies
pip install -r requirements.txt

# 3. Install dev dependencies (for testing)
pip install -r requirements-dev.txt
```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available Configuration:
- `APP_ENV`: Environment mode (`development` / `production`)
- `MOCK_MODE`: `true` to return deterministic demo fixtures (Set `false` for live AI/DB processing)
- `GEMINI_API_KEY`: Google Gemini API key for real voice/photo multimodal capture and Copilot explanations
- `DATABASE_URL`: SQLAlchemy connection string (default: `sqlite:///./medex.db`)
- `CORS_ORIGINS`: Allowed CORS origins (e.g. `http://localhost:5173`)
- `PORT`: HTTP Server port (default `8000`)

---

## Running the Application & Tests

```bash
# Run server
uvicorn app.main:app --reload --port 8000

# Run full test suite (74 tests)
python -m pytest
```

---

## Cloud Run & Container Deployment

MedEx is configured for Cloud Run deployment via Docker:

```bash
# Build Docker image
docker build -t medex-backend ./backend

# Run Docker container locally
docker run -p 8000:8000 -e PORT=8000 -e MOCK_MODE=true medex-backend
```

---

## Architectural & System Disclosures

1. **Synthetic Data**: All facilities, stock snapshots, footprints, and transactions represent synthetic health supply chain data created for demonstration purposes.
2. **Simulated Federated Learning**: The cross-state federated learning rounds simulate FedAvg model updates across Tamil Nadu, Bihar, and Maharashtra nodes. The API explicitly discloses `"mode": "simulated"`.
3. **Prototype Role-Based Access Control**: Prototype authentication uses request headers (`X-Role`, `X-District`, `X-User`). Production deployment requires integrating OAuth2 / OIDC state credentials.
4. **Gemini Integration**: Real multimodal extraction executes when `MOCK_MODE=false` and `GEMINI_API_KEY` is provided. Reverts to deterministic fallback fixtures if Gemini is unconfigured or unavailable.
