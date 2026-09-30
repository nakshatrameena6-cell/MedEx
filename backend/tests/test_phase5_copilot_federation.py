import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_copilot_ask_mock_mode():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "test_district_officer"
    }
    payload = {
        "prompt": "What is the stockout risk for ORS in TN-D01?",
        "context_district_id": "TN-D01",
        "context_drug_code": "ORS"
    }
    response = client.post("/api/v1/copilot/ask", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["confidence"] == 0.95
    assert data["model"] == "gemini-1.5-flash-mock"
    assert "sources" in data
    assert "limitations" in data


def test_copilot_ask_direct_route():
    headers = {
        "X-Role": "STATE",
        "X-User": "test_state_admin"
    }
    payload = {
        "prompt": "Explain state-wide vaccine stock resilience.",
    }
    response = client.post("/api/v1/copilot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["confidence"] == 0.95


def test_copilot_ask_normal_mode_gemini_unavailable(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "MOCK_MODE", False)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    headers = {
        "X-Role": "STATE",
        "X-User": "test_state_admin"
    }
    payload = {
        "prompt": "Why was transfer TR-101 recommended?"
    }
    response = client.post("/api/v1/copilot/ask", json=payload, headers=headers)
    assert response.status_code == 502
    data = response.json()
    assert data["error"] == "upstream_unavailable"


def test_copilot_rbac_district_scope():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "officer_d01"
    }
    payload = {
        "prompt": "Tell me about stock in another district",
        "context_district_id": "TN-D02"
    }
    response = client.post("/api/v1/copilot/ask", json=payload, headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "forbidden"


def test_copilot_facility_context_explanation():
    headers = {
        "X-Role": "FACILITY",
        "X-District": "TN-D01",
        "X-User": "pharmacist_f01"
    }
    payload = {
        "prompt": "Explain stock risk and forecast for my facility",
        "context_facility_id": "TN-D01-F01",
        "context_drug_code": "ORS"
    }
    response = client.post("/api/v1/copilot/ask", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "supporting_facts" in data
    facts = data["supporting_facts"]
    assert facts.get("facility", {}).get("facility_id") == "TN-D01-F01"
    assert "forecast" in facts
    assert "risk" in facts


def test_federation_trigger_round_state_role():
    headers = {
        "X-Role": "STATE",
        "X-User": "state_director"
    }
    payload = {
        "round_number": 3,
        "participating_nodes": 18,
        "aggregation_method": "FedAvg"
    }
    response = client.post("/api/v1/federation/round", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["round_id"] == "FED-R03"
    assert data["round_number"] == 3
    assert data["participating_nodes"] == 18
    assert data["status"] == "COMPLETED"
    assert data["model_version"] == "v1.3.0"
    assert data["aggregation_method"] == "FedAvg"


def test_federation_trigger_round_unauthorized_role():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "district_user"
    }
    payload = {
        "participating_nodes": 10
    }
    response = client.post("/api/v1/federation/round", json=payload, headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "forbidden"


def test_federation_get_rounds_history():
    headers = {
        "X-Role": "AUDITOR",
        "X-User": "auditor_01"
    }
    response = client.get("/api/v1/federation/rounds", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "rounds" in data
    assert isinstance(data["rounds"], list)
    assert len(data["rounds"]) >= 1


def test_federation_get_rounds_unauthorized():
    headers = {
        "X-Role": "FACILITY",
        "X-User": "facility_user"
    }
    response = client.get("/api/v1/federation/rounds", headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "forbidden"


def test_federation_submit_local_update_invalid_transition():
    headers = {
        "X-Role": "STATE",
        "X-User": "state_admin"
    }
    payload = {
        "node_id": "TN-NODE-01",
        "local_samples": 500,
        "weights_delta": {"layer1": [0.01, -0.02]}
    }
    response = client.post("/api/v1/federation/rounds/FED-R01/update", json=payload, headers=headers)
    assert response.status_code == 409
    data = response.json()
    assert data["error"] == "invalid_transition"


def test_federation_submit_local_update_not_found():
    headers = {
        "X-Role": "STATE",
        "X-User": "state_admin"
    }
    payload = {
        "node_id": "TN-NODE-01",
        "local_samples": 500,
        "weights_delta": {"layer1": [0.01]}
    }
    response = client.post("/api/v1/federation/rounds/FED-NONEXISTENT/update", json=payload, headers=headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "not_found"
