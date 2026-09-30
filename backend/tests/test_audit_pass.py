import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import get_db, engine
from app.db.models import Base, Facility, DrugMaster, StockSnapshot, AuditLog
from sqlalchemy.orm import Session

client = TestClient(app)

FACILITY_HEADERS = {
    "X-Role": "FACILITY",
    "X-User": "USR-FAC-01",
    "X-District": "TN-D01"
}

DISTRICT_HEADERS = {
    "X-Role": "DISTRICT",
    "X-User": "USR-DIST-01",
    "X-District": "TN-D01"
}

AUDITOR_HEADERS = {
    "X-Role": "AUDITOR",
    "X-User": "USR-AUD-01",
    "X-District": "TN-D01"
}


def test_health_endpoint_contract():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "mock_mode" in data
    assert data["version"] == "1.1.0"
    assert "time" in data
    assert data["time"].endswith("Z")


def test_scenario_id_uniqueness_collision_fix():
    res1 = client.post(
        "/api/v1/scenario/run",
        json={"scenario_type": "MONSOON_SPIKE", "district_id": "TN-D01"},
        headers=DISTRICT_HEADERS
    )
    res2 = client.post(
        "/api/v1/scenario/run",
        json={"scenario_type": "MONSOON_SPIKE", "district_id": "TN-D01"},
        headers=DISTRICT_HEADERS
    )
    assert res1.status_code == 200
    assert res2.status_code == 200
    data1 = res1.json()
    data2 = res2.json()
    assert data1["scenario_id"] != data2["scenario_id"]


def test_capture_flow_voice_photo_and_persistence():
    # 1. Voice Capture
    voice_res = client.post(
        "/api/v1/capture/voice",
        json={"facility_id": "TN-PHC-002", "language": "en-IN"},
        headers=FACILITY_HEADERS
    )
    assert voice_res.status_code == 200
    v_data = voice_res.json()
    assert v_data["facility_id"] == "TN-PHC-002"
    assert len(v_data["rows"]) > 0

    # 2. Confirm Capture (PERSISTENCE TEST)
    confirm_res = client.post(
        "/api/v1/capture/confirm",
        json={
            "capture_id": v_data["capture_id"],
            "facility_id": "TN-PHC-002",
            "rows": [
                {
                    "drug_code": "ORS",
                    "qty": 450,
                    "unit": "sachet"
                }
            ]
        },
        headers=FACILITY_HEADERS
    )
    assert confirm_res.status_code == 200
    c_data = confirm_res.json()
    assert c_data["rows_saved"] == 1
    assert len(c_data["updated_status"]) == 1
    assert c_data["updated_status"][0]["drug_code"] == "ORS"

    # 3. Verify status live refresh
    fac_res = client.get("/api/v1/facilities/TN-PHC-002/status", headers=FACILITY_HEADERS)
    assert fac_res.status_code == 200



def test_transfer_decision_alias_compatibility():
    # Submit transfer decision using legacy alias "action" and "notes"
    res1 = client.post(
        "/api/v1/transfers/TRF-DEMO-001/decision",
        json={"action": "APPROVE", "notes": "Approved by district officer"},
        headers=DISTRICT_HEADERS
    )
    # Both 200 (if open) or 409/404 are acceptable contract responses
    assert res1.status_code in (200, 404, 409)

    # Submit transfer decision using canonical "decision" and "comment"
    res2 = client.post(
        "/api/v1/transfers/TRF-DEMO-001/decision",
        json={"decision": "APPROVE", "comment": "Approved by district officer"},
        headers=DISTRICT_HEADERS
    )
    assert res2.status_code in (200, 404, 409)


def test_copilot_ask_alias_compatibility():
    res1 = client.post(
        "/api/v1/copilot/ask",
        json={"prompt": "What is the stock risk for ORS in TN-D01?"},
        headers=DISTRICT_HEADERS
    )
    assert res1.status_code == 200

    res2 = client.post(
        "/api/v1/copilot/ask",
        json={"question": "What is the stock risk for ORS in TN-D01?"},
        headers=DISTRICT_HEADERS
    )
    assert res2.status_code == 200


def test_auditor_write_forbidden():
    res = client.post(
        "/api/v1/scenario/run",
        json={"scenario_type": "MONSOON_SPIKE", "district_id": "TN-D01"},
        headers=AUDITOR_HEADERS
    )
    assert res.status_code == 403
