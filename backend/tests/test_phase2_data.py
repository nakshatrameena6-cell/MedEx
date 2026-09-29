import pytest
from app.db.database import SessionLocal
from app.db.models import Alert, AuditLog, DrugMaster, DrugNameMap, Facility, StockSnapshot, Transfer
from app.db.repositories import AlertRepository, AuditRepository, FacilityRepository, StockSnapshotRepository, TransferRepository
from app.db.seed import seed_database
from app.services.audit import audit_service


@pytest.fixture(scope="module", autouse=True)
def seed_test_db():
    db = SessionLocal()
    try:
        seed_database(db, reset=True)
    finally:
        db.close()


def test_seed_database_deterministic(client):
    db = SessionLocal()
    try:
        facility_count = db.query(Facility).count()
        drug_count = db.query(DrugMaster).count()
        snapshot_count = db.query(StockSnapshot).count()
        transfer_count = db.query(Transfer).count()
        alert_count = db.query(Alert).count()

        assert facility_count == 108
        assert drug_count == 10
        assert snapshot_count >= 60000  # 108 facilities x 10 drugs x 56 days
        assert transfer_count >= 2
        assert alert_count >= 2
    finally:
        db.close()


def test_facilities_api_database_backed(client):
    headers = {"X-Role": "STATE"}
    response = client.get("/api/v1/facilities", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 100
    assert data[0]["dataset_type"] == "synthetic_demo"


def test_facilities_api_filtering(client):
    headers = {"X-Role": "STATE"}
    res_tn = client.get("/api/v1/facilities?state_id=TN", headers=headers)
    assert res_tn.status_code == 200
    for f in res_tn.json():
        assert f["state_id"] == "TN"

    res_dist = client.get("/api/v1/facilities?district_id=TN-D01", headers=headers)
    assert res_dist.status_code == 200
    assert len(res_dist.json()) == 12  # 3 blocks x 4 PHCs


def test_facility_status_api_database_backed(client):
    headers = {"X-Role": "STATE"}
    res = client.get("/api/v1/facilities/TN-PHC-001/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["facility_id"] == "TN-PHC-001"
    assert len(data["items"]) == 10
    drug_ids = [item["drug_id"] for item in data["items"]]
    assert "ORS" in drug_ids
    assert "PARA" in drug_ids


def test_transfers_api_database_backed(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    res = client.get("/api/v1/transfers", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["transfer_id"] == "TRF-001"


def test_alerts_api_database_backed(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    res = client.get("/api/v1/alerts", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["alerts"]) >= 1
    assert data["alerts"][0]["severity"] in ("RED", "AMBER")


def test_rbac_data_isolation_facility_role(client):
    # FACILITY role with X-District TN-D01
    headers = {"X-Role": "FACILITY", "X-District": "TN-D01"}
    res = client.get("/api/v1/facilities", headers=headers)
    assert res.status_code == 200
    # All returned facilities must belong to TN-D01
    for f in res.json():
        assert f["district_id"] == "TN-D01"


def test_rbac_data_isolation_block_role(client):
    headers = {"X-Role": "BLOCK", "X-District": "TN-D01"}
    res = client.get("/api/v1/facilities", headers=headers)
    assert res.status_code == 200
    for f in res.json():
        assert f["district_id"] == "TN-D01"


def test_rbac_data_isolation_district_role(client):
    headers = {"X-Role": "DISTRICT", "X-District": "BR-D01"}
    res = client.get("/api/v1/facilities", headers=headers)
    assert res.status_code == 200
    for f in res.json():
        assert f["district_id"] == "BR-D01"


def test_audit_service_and_repository(client):
    db = SessionLocal()
    try:
        repo = AuditRepository(db)
        initial_count = len(repo.get_all())
        assert initial_count >= 1
    finally:
        db.close()
