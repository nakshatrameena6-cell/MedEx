# MedEx — Federated AI Health-Supply-Chain Platform (Backend)

Phase 1, Phase 2, and Phase 3 Backend Intelligence Layer.

## Requirements
- Python 3.11+
- FastAPI & Pydantic v2
- SQLAlchemy 2.x
- Docker

## Local Setup

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
```

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available variables:
- `APP_ENV`: Environment mode (`development`/`production`)
- `MOCK_MODE`: `true` to return deterministic mock responses and `X-Mock: true` header (Set to `false` for live database intelligence calculations)
- `DATABASE_URL`: SQLAlchemy connection string (default: `sqlite:///./medex.db`)
- `CORS_ORIGINS`: Allowed CORS origins JSON or comma-separated list
- `LOG_LEVEL`: Logging verbosity (`INFO`, `DEBUG`, etc.)
- `PORT`: HTTP Server port (default `8000`)

## Database Initialization & Seeding

Seed or reset the synthetic demo health-supply-chain universe:

```bash
# Seed synthetic database (108 facilities, 10 drugs, 56-day history)
python -m app.db.seed

# Reset and re-seed database deterministically
python -m app.db.seed --reset
```

> **Disclaimer**: This environment uses synthetic demo health-supply-chain data for MedEx. It contains NO patient identifiers and is not operational health data.

## Running the Backend

```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation & Verification

- Health Check: `GET http://localhost:8000/api/v1/health`
- Interactive Swagger UI: `http://localhost:8000/docs`
- OpenAPI Spec: `http://localhost:8000/api/v1/openapi.json`
- Demand Forecast: `GET http://localhost:8000/api/v1/forecast`
- Shortage Risk: `GET http://localhost:8000/api/v1/risk`

## Phase 3 Intelligence Methodologies

### 1. Demand Forecast Methodology (`GET /api/v1/forecast`)
- **Historical Window**: Last 28 days of daily consumption, stock issues, and OPD footfall data.
- **Baseline Demand (P50)**: Derived from moving average daily consumption, correlated with OPD footfall and elevated disease signals (25% signal uplift applied when active).
- **Uncertainty Quantiles (P10 & P90)**: Derived via Gaussian percentile bounds from historical residual standard deviation ($\sigma$):
  - $P10 = \max(0, P50 - 1.28 \cdot \sigma)$
  - $P90 = P50 + 1.28 \cdot \sigma$
- **Horizon**: Configurable daily forecast points over 2–8 weeks (default 30 days).
- **Drivers**: Structured, deterministic facts explaining forecast inputs (e.g. OPD footfall, disease signals).

### 2. Shortage Risk Classification & Priority Engine (`GET /api/v1/risk`)
- **Days of Cover**:
  - $Cover_{P50} = \text{usable\_stock} / P50_{\text{daily}}$
  - $Cover_{P90} = \text{usable\_stock} / P90_{\text{daily}}$
- **Classification Rules**:
  - **RED**: $Cover_{P50} < \text{Lead Time} + \text{Safety Buffer}$
  - **AMBER**: $Cover_{P50} < 2 \cdot \text{Lead Time}$ (and not RED)
  - **GREEN**: $Cover_{P50} \ge 2 \cdot \text{Lead Time}$ (Hidden by default unless `status=ALL`)
- **Stockout Probability ($P_{\text{stockout}}$)**: Bounded 0.0 to 1.0 probability of stock exhaustion prior to replenishment lead time arrival.
- **PRD Priority Formula**:
  $$\text{Priority} = P_{\text{stockout}} \times \text{Drug Criticality Weight} \times \text{Normalized Population} \times \text{Vulnerability Weight} \times \text{Emergency Multiplier}$$
  - Results are returned ordered by `priority` descending.
- **Exposure**: Integer shortage quantity projected over replenishment lead time.

## Automated Tests

Run the pytest test suite:

```bash
pytest
```

## Docker Build & Run

```bash
# Build Docker image
docker build -t medex-backend ./backend

# Run Docker container
docker run -p 8000:8000 medex-backend
```
