# MedEx — Federated AI Health-Supply-Chain Platform (Backend)

Phase 1 & Phase 2 & Phase 3 Backend Intelligence Layer.

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
- `MOCK_MODE`: `true` to return deterministic mock responses and `X-Mock: true` header
- `DATABASE_URL`: SQLAlchemy connection string (default: `sqlite:///./aushadhigrid.db`)
- `CORS_ORIGINS`: Allowed CORS origins JSON or comma-separated list
- `LOG_LEVEL`: Logging verbosity (`INFO`, `DEBUG`, etc.)
- `PORT`: HTTP Server port (default `8000`)

## Running the Backend

```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation & Verification

- Health Check: `GET http://localhost:8000/api/v1/health`
- Interactive Swagger UI: `http://localhost:8000/docs`
- OpenAPI Spec: `http://localhost:8000/api/v1/openapi.json`

## Automated Tests

Run the pytest test suite:

```bash
pytest
```

## Docker Build & Run

```bash
# Build Docker image
docker build -t aushadhigrid-backend ./backend

# Run Docker container
docker run -p 8000:8000 aushadhigrid-backend
```

## Phase 1 Status
Phase 1 establishes the backend API contract boundary, role/RBAC framework, error handling, database/audit abstractions, and deterministic mock responses. Business logic, ML models, and AI copilot integrations are deferred to subsequent phases.
