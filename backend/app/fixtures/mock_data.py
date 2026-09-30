"""
Deterministic mock fixtures for MedEx API Phase 1.
"""

MOCK_HEALTH = {
    "status": "ok",
    "version": "1.1.0",
    "app": "MedEx API"
}

MOCK_FACILITIES = [
    {
        "facility_id": "TN-PHC-014",
        "name": "Kanchipuram Primary Health Centre",
        "district_id": "TN-D01",
        "block_id": "TN-B01",
        "facility_type": "PHC",
        "stock_status": "NORMAL"
    },
    {
        "facility_id": "TN-CHC-002",
        "name": "Chengalpattu Community Health Centre",
        "district_id": "TN-D01",
        "block_id": "TN-B02",
        "facility_type": "CHC",
        "stock_status": "CRITICAL"
    }
]

MOCK_FACILITY_STATUS = {
    "facility_id": "TN-PHC-014",
    "name": "Kanchipuram Primary Health Centre",
    "district_id": "TN-D01",
    "block_id": "TN-B01",
    "items": [
        {"drug_id": "ORS", "name": "Oral Rehydration Salts", "quantity": 450, "reorder_level": 100, "unit": "sachet"},
        {"drug_id": "PARACETAMOL", "name": "Paracetamol 500mg", "quantity": 120, "reorder_level": 500, "unit": "tablet"}
    ],
    "last_updated": "2026-09-29T10:00:00Z"
}

MOCK_FORECAST = [
    {
        "facility_id": "TN-PHC-014",
        "drug_id": "ORS",
        "horizon_days": 30,
        "predicted_demand": 600,
        "confidence": 0.89,
        "forecast_date": "2026-09-29"
    }
]

MOCK_RISK = [
    {
        "facility_id": "TN-CHC-002",
        "drug_id": "PARACETAMOL",
        "risk_level": "HIGH",
        "stockout_days": 4,
        "confidence": 0.92
    }
]

MOCK_OPTIMIZATION = {
    "optimization_id": "OPT-20260929-001",
    "status": "RECOMMENDED",
    "transfers_recommended": 2,
    "details": "Redistribution proposal from TN-PHC-014 to TN-CHC-002"
}

MOCK_TRANSFERS = [
    {
        "transfer_id": "TRF-001",
        "source_facility_id": "TN-PHC-014",
        "destination_facility_id": "TN-CHC-002",
        "drug_id": "PARACETAMOL",
        "quantity": 200,
        "status": "PENDING",
        "created_at": "2026-09-29T09:00:00Z"
    }
]

MOCK_ALERTS = [
    {
        "alert_id": "ALT-001",
        "facility_id": "TN-CHC-002",
        "severity": "WARNING",
        "message": "Stock of Paracetamol 500mg below threshold",
        "timestamp": "2026-09-29T08:30:00Z"
    }
]

MOCK_AUDIT = [
    {
        "id": 1,
        "user_id": "district_admin",
        "role": "DISTRICT",
        "action": "VIEW_FACILITIES",
        "resource": "facilities",
        "resource_id": "TN-D01",
        "timestamp": "2026-09-29T10:15:00Z",
        "result": "SUCCESS"
    }
]

MOCK_FEDERATION_ROUNDS = [
    {
        "round_id": "FED-R01",
        "round_number": 1,
        "participating_nodes": 12,
        "status": "COMPLETED",
        "accuracy": 0.94,
        "timestamp": "2026-09-29T00:00:00Z"
    }
]

MOCK_ALERT_AUDIO = {
    "alert_id": "ALT-001",
    "audio_url": "https://mock.medex.local/audio/ALT-001.mp3",
    "audio_format": "mp3",
    "duration_seconds": 12.5,
    "transcript": "Warning: Stock of Paracetamol 500mg at Chengalpattu CHC is below threshold."
}

