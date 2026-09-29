import pytest
from fastapi.testclient import TestClient
from app.db.database import SessionLocal
from app.db.seed import seed_database
from app.main import app


@pytest.fixture(scope="module", autouse=True)
def prepare_database():
    db = SessionLocal()
    try:
        seed_database(db, reset=True)
    finally:
        db.close()


def test_forecast_endpoint_database_backed(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/forecast?facility_id=TN-PHC-001&drug_id=ORS&horizon_days=30", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    fc = data[0]

    assert fc["facility_id"] == "TN-PHC-001"
    assert fc["drug_id"] == "ORS"
    assert fc["horizon_days"] == 30
    assert fc["predicted_demand"] > 0
    assert "p10" in fc and "p50" in fc and "p90" in fc
    assert fc["p10"] <= fc["p50"] <= fc["p90"]

    # Daily forecast points
    assert len(fc["daily_forecast"]) == 30
    daily_point = fc["daily_forecast"][0]
    assert daily_point["p10"] <= daily_point["p50"] <= daily_point["p90"]

    # Model Metadata
    meta = fc["model_metadata"]
    assert meta["model_name"] == "Deterministic Statistical Baseline"
    assert meta["history_window_days"] == 28
    assert "methodology" in meta

    # Drivers
    assert len(fc["drivers"]) >= 1


def test_risk_endpoint_database_backed_amber_red_only(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/risk", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1

    # Verify default returns AMBER and RED only
    for r in data:
        assert r["status"] in ("AMBER", "RED")

    # Verify priority descending order
    priorities = [r["priority"] for r in data]
    assert priorities == sorted(priorities, reverse=True)


def test_risk_endpoint_explicit_status_all(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/risk?status=ALL", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    statuses = set(r["status"] for r in data)
    assert "GREEN" in statuses or "AMBER" in statuses or "RED" in statuses


def test_risk_classification_rules_and_metrics(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/risk?facility_id=TN-PHC-002&drug_id=ORS", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    r = data[0]

    assert r["facility_id"] == "TN-PHC-002"
    assert r["drug_id"] == "ORS"
    assert 0.0 <= r["p_stockout"] <= 1.0
    assert r["cover_days"] >= 0.0
    assert r["cover_days_p90"] >= 0.0
    assert r["priority"] >= 0.0
    assert r["exposure_units"] >= 0
    assert isinstance(r["reason"], str) and len(r["reason"]) > 10
    assert isinstance(r["flags"], list)


def test_declining_ors_shortage_scenario(client):
    # TN-PHC-002 was seeded with declining ORS stock
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    res = client.get("/api/v1/risk?facility_id=TN-PHC-002&drug_id=ORS", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    r = data[0]
    assert r["status"] in ("RED", "AMBER")
    assert r["priority"] > 1.0
    assert "LOW_COVER" in r["flags"] or "STOCKOUT" in r["flags"]


def test_rbac_risk_cross_district_isolation(client):
    # District TN-D01 user trying to query BR-D01 district parameter
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    res = client.get("/api/v1/risk?district_id=BR-D01", headers=headers)
    assert res.status_code == 200
    # SQL query must constrain results to TN-D01 only
    for r in res.json():
        assert r["facility_id"].startswith("TN")


def test_rbac_forecast_cross_district_isolation(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    res = client.get("/api/v1/forecast?district_id=BR-D01", headers=headers)
    assert res.status_code == 200
    for fc in res.json():
        assert fc["facility_id"].startswith("TN")


def test_determinism_identical_queries(client):
    headers = {"X-Role": "STATE"}
    res1 = client.get("/api/v1/risk?facility_id=TN-PHC-001&drug_id=ORS", headers=headers)
    res2 = client.get("/api/v1/risk?facility_id=TN-PHC-001&drug_id=ORS", headers=headers)

    assert res1.status_code == 200 and res2.status_code == 200
    r1 = res1.json()[0]
    r2 = res2.json()[0]

    assert r1["priority"] == r2["priority"]
    assert r1["cover_days"] == r2["cover_days"]
    assert r1["p_stockout"] == r2["p_stockout"]
    assert r1["reason"] == r2["reason"]
