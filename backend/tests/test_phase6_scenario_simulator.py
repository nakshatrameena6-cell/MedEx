import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal
from app.db.models import Facility, StockSnapshot, Transfer

client = TestClient(app)


def test_run_scenario_monsoon_spike():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "district_officer"
    }
    payload = {
        "scenario_type": "MONSOON_SPIKE",
        "district_id": "TN-D01",
        "parameters": {
            "demand_multiplier": 1.5,
            "stock_multiplier": 0.8
        }
    }
    response = client.post("/api/v1/scenario/run", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "scenario_id" in data
    assert data["status"] == "COMPLETED"
    assert data["is_simulated"] is True
    assert "baseline_comparison" in data
    comp = data["baseline_comparison"]
    assert "baseline_shortages" in comp
    assert "simulated_shortages" in comp
    assert "copilot_explanation" in comp


def test_run_scenario_direct_route():
    headers = {
        "X-Role": "STATE",
        "X-User": "state_director"
    }
    payload = {
        "scenario_type": "SUPPLY_CHAIN_BREAK",
        "district_id": "TN-D01"
    }
    response = client.post("/api/v1/scenario", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["is_simulated"] is True


def test_run_scenario_custom_parameters():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "district_officer"
    }
    payload = {
        "scenario_type": "CUSTOM",
        "district_id": "TN-D01",
        "parameters": {
            "stock_change_pct": -40.0,
            "demand_change_pct": 30.0,
            "unavailable_facility_ids": ["TN-PHC-002"]
        }
    }
    response = client.post("/api/v1/scenario/run", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["projected_shortages_count"] >= 1
    comp = data["baseline_comparison"]
    assert any(f.get("facility_id") == "TN-PHC-002" for f in comp.get("risk_shifts", []))


def test_critical_production_safety_state_isolation():
    """MANDATORY SAFETY TEST: Proves scenarios never mutate production stock, transfers, facilities, or risk state."""
    db = SessionLocal()
    try:
        # Record pre-scenario production state counts and snapshot quantities
        initial_transfers_count = db.query(Transfer).count()
        initial_stock_count = db.query(StockSnapshot).count()
        facility_001 = db.query(Facility).filter(Facility.facility_id == "TN-PHC-001").first()
        initial_fac_status = facility_001.stock_status
        
        sample_snap = db.query(StockSnapshot).filter(
            StockSnapshot.facility_id == "TN-PHC-001",
            StockSnapshot.drug_code == "ORS"
        ).first()
        initial_snap_qty = sample_snap.quantity if sample_snap else None
    finally:
        db.close()

    # Execute extreme supply drop simulation
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "district_officer"
    }
    payload = {
        "scenario_type": "EXTREME_SHORTAGE",
        "district_id": "TN-D01",
        "parameters": {
            "stock_change_pct": -90.0,
            "demand_change_pct": 200.0
        }
    }
    sim_res = client.post("/api/v1/scenario/run", json=payload, headers=headers)
    assert sim_res.status_code == 200

    # Verify post-scenario production database state is 100% UNCHANGED
    db2 = SessionLocal()
    try:
        post_transfers_count = db2.query(Transfer).count()
        post_stock_count = db2.query(StockSnapshot).count()
        post_facility_001 = db2.query(Facility).filter(Facility.facility_id == "TN-PHC-001").first()
        post_sample_snap = db2.query(StockSnapshot).filter(
            StockSnapshot.facility_id == "TN-PHC-001",
            StockSnapshot.drug_code == "ORS"
        ).first()

        assert post_transfers_count == initial_transfers_count, "Scenario MUST NOT insert real production transfers"
        assert post_stock_count == initial_stock_count, "Scenario MUST NOT insert or delete production stock records"
        assert post_facility_001.stock_status == initial_fac_status, "Scenario MUST NOT alter real facility stock status"
        if sample_snap and post_sample_snap:
            assert post_sample_snap.quantity == initial_snap_qty, "Scenario MUST NOT modify production stock quantities"
    finally:
        db2.close()


def test_scenario_history_and_retrieval():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "district_officer"
    }
    # 1. Run scenario
    run_res = client.post("/api/v1/scenario/run", json={"scenario_type": "MONSOON_SPIKE"}, headers=headers)
    sc_id = run_res.json()["scenario_id"]

    # 2. Get scenario details
    get_res = client.get(f"/api/v1/scenario/{sc_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["scenario_id"] == sc_id

    # 3. List scenarios
    list_res = client.get("/api/v1/scenario/history", headers=headers)
    assert list_res.status_code == 200
    scenarios = list_res.json()["scenarios"]
    assert len(scenarios) >= 1
    assert any(s["scenario_id"] == sc_id for s in scenarios)


def test_scenario_rbac_district_scope_violation():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "district_officer_tn01"
    }
    payload = {
        "scenario_type": "DEMAND_SURGE",
        "district_id": "BR-D01"
    }
    res = client.post("/api/v1/scenario/run", json=payload, headers=headers)
    assert res.status_code == 403
    data = res.json()
    err_code = data["error"]["code"] if isinstance(data["error"], dict) else data["error"]
    assert err_code.upper() in ("FORBIDDEN", "FORBIDDEN_ERROR")


def test_scenario_audit_event_recorded():
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "audit_test_user"
    }
    client.post("/api/v1/scenario/run", json={"scenario_type": "AUDIT_TEST"}, headers=headers)
    
    audit_res = client.get("/api/v1/audit", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()["logs"]
    actions = [item["action"] for item in logs]
    assert any("SCENARIO" in a for a in actions)
