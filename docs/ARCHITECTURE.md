# MedEx Architecture Overview

MedEx is an intelligent, AI-powered health supply chain resilience platform built for state and district public health departments.

```text
                    ┌─────────────────────┐
                    │  React + Vite UI    │
                    └──────────┬──────────┘
                               │ HTTP / JSON
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI API      │
                    │   (MedEx v1.1.0)    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌────────────┐      ┌──────────────┐     ┌─────────────┐
   │   Gemini   │      │  ML / Risk   │     │ OR-Tools    │
   │ Multimodal │      │  Forecasting │     │ Optimizer   │
   └────────────┘      └──────────────┘     └─────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                       ┌──────────────┐
                       │ SQLAlchemy / │
                       │    SQLite    │
                       └──────────────┘
```

## Key Components

1. **Multimodal Stock Capture**:
   - Voice audio and stock register photo uploads processed via Google Gemini (`google-generativeai` SDK).
   - Drug master & alias matching (`DrugMaster`, `DrugNameMap`) with strict confidence evaluation (0.85 threshold).
   - Confirmed stock updates write `StockSnapshot` ledgers and trigger live PHC risk recalculation.

2. **Deterministic Risk & Demand Forecast Engines**:
   - 28-day historical consumption baseline with Gaussian uncertainty bounds (P10, P50, P90).
   - Disease signal uplift and OPD footfall correlation.
   - Deterministic risk scoring based on stock cover days, lead times, and facility vulnerability weights.

3. **Redistribution Optimizer**:
   - Google OR-Tools linear solver for inter-facility medicine transfer proposals.
   - Human-in-the-loop workflow (`APPROVE`, `MODIFY`, `REJECT`, `ESCALATE`).

4. **MedEx Copilot & Scenario Simulator**:
   - Gemini-backed explainable AI grounded in database context with strict read-only SQL/service guardrails.
   - Isolated in-memory hypothetical scenario simulator (`MONSOON_SPIKE`, `SUPPLY_CHAIN_BREAK`, `DEMAND_SURGE`).

5. **Simulated Federated Learning**:
   - Demonstration of cross-state model aggregation (`FedAvg`) across Tamil Nadu, Bihar, and Maharashtra.
