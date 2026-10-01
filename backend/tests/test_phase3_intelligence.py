import pytest
from fastapi.testclient import TestClient
from app.db.database import SessionLocal
from app.db.seed import seed_database
from app.main import app




def test_forecast_endpoint_database_backed(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/forecast?facility_id=TN-PHC-001&drug_id=ORS&horizon_days=30", headers=headers)
    assert res.status_code == 200
    data = res.json()
    fc = data[0] if isinstance(data, list) else data

    assert fc["facility_id"] == "TN-PHC-001"
    assert (fc.get("drug_id") == "ORS" or fc.get("drug_code") == "ORS")
    assert fc["predicted_demand"] > 0 or len(fc.get("points", [])) >= 1
    points = fc.get("points") or fc.get("daily_forecast")
    assert len(points) >= 1
    daily_point = points[0]
    assert daily_point["p10"] <= daily_point["p50"] <= daily_point["p90"]

    # Drivers
    assert len(fc["drivers"]) >= 1


def test_risk_endpoint_database_backed_amber_red_only(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/risk", headers=headers)
    assert res.status_code == 200
    data_obj = res.json()
    data = data_obj["items"] if isinstance(data_obj, dict) and "items" in data_obj else data_obj
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
    data_obj = res.json()
    data = data_obj["items"] if isinstance(data_obj, dict) and "items" in data_obj else data_obj
    assert len(data) >= 1
    statuses = set(r["status"] for r in data)
    assert "GREEN" in statuses or "AMBER" in statuses or "RED" in statuses


def test_risk_classification_rules_and_metrics(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/risk?facility_id=TN-PHC-002&drug_id=ORS", headers=headers)
    assert res.status_code == 200
    data_obj = res.json()
    data = data_obj["items"] if isinstance(data_obj, dict) and "items" in data_obj else data_obj
    assert len(data) >= 1
    r = data[0]

    assert r["facility_id"] == "TN-PHC-002"
    assert (r.get("drug_id") == "ORS" or r.get("drug_code") == "ORS")
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
    data_obj = res.json()
    data = data_obj["items"] if isinstance(data_obj, dict) and "items" in data_obj else data_obj
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
    data_obj = res.json()
    data = data_obj["items"] if isinstance(data_obj, dict) and "items" in data_obj else data_obj
    # SQL query must constrain results to TN-D01 only
    for r in data:
        assert r["facility_id"].startswith("TN")


def test_rbac_forecast_cross_district_isolation(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    res = client.get("/api/v1/forecast?district_id=BR-D01", headers=headers)
    assert res.status_code == 200
    data = res.json()
    fc = data[0] if isinstance(data, list) else data
    assert fc["facility_id"].startswith("TN")


def test_determinism_identical_queries(client):
    headers = {"X-Role": "STATE"}
    res1 = client.get("/api/v1/risk?facility_id=TN-PHC-001&drug_id=ORS&status=ALL", headers=headers)
    res2 = client.get("/api/v1/risk?facility_id=TN-PHC-001&drug_id=ORS&status=ALL", headers=headers)

    assert res1.status_code == 200 and res2.status_code == 200
    d1 = res1.json()
    d2 = res2.json()
    r1 = d1["items"][0] if isinstance(d1, dict) and "items" in d1 else d1[0]
    r2 = d2["items"][0] if isinstance(d2, dict) and "items" in d2 else d2[0]

    assert r1["priority"] == r2["priority"]
    assert r1["cover_days"] == r2["cover_days"]
    assert r1["p_stockout"] == r2["p_stockout"]
    assert r1["reason"] == r2["reason"]
