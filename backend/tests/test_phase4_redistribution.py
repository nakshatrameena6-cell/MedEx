import pytest
from app.core.config import settings
from app.db.database import SessionLocal
from app.db.models import AuditLog, IssuesReceipts, StockSnapshot, Transfer
from app.db.seed import seed_database


@pytest.fixture(autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db)
    db.close()



def test_optimize_endpoint_basic(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    payload = {
        "district_id": "TN-D01",
        "drug_code": "ORS",
        "emergency_mode": False,
        "allow_cross_state": False,
        "blocked_facility_ids": [],
        "max_proposals": 5
    }
    res = client.post("/api/v1/optimize", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "optimization_id" in data
    assert "status" in data
    assert data["status"] in ("OPTIMAL", "FEASIBLE", "INFEASIBLE")
    assert "proposals" in data
    assert isinstance(data["proposals"], list)
    if data["status"] == "OPTIMAL":
        assert len(data["proposals"]) > 0
        p = data["proposals"][0]
        assert "transfer_id" in p
        assert "from" in p or "source_facility_id" in p
        assert "to" in p or "destination_facility_id" in p
        assert p["status"] == "OPEN"
        assert p["rank"] == 1


def test_cross_state_restriction_validation(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    # allow_cross_state True without emergency_mode -> 422 constraint_violation
    payload = {
        "district_id": "TN-D01",
        "emergency_mode": False,
        "allow_cross_state": True
    }
    res = client.post("/api/v1/optimize", json=payload, headers=headers)
    assert res.status_code == 422
    data = res.json()
    assert data["error"]["code"] == "constraint_violation"


def test_blocked_facilities_exclusion(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    payload = {
        "district_id": "TN-D01",
        "blocked_facility_ids": ["TN-PHC-001", "TN-PHC-002", "TN-CHC-001"],
        "max_proposals": 5
    }
    res = client.post("/api/v1/optimize", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    for p in data.get("proposals", []):
        src = p.get("source_facility_id") or p.get("from")
        dst = p.get("destination_facility_id") or p.get("to")
        assert src not in payload["blocked_facility_ids"]
        assert dst not in payload["blocked_facility_ids"]


def test_transfer_lifecycle_approve(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    # 1. Run optimize to generate an OPEN proposal
    opt_res = client.post("/api/v1/optimize", json={"district_id": "TN-D01"}, headers=headers)
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert len(opt_data["proposals"]) > 0
    t_id = opt_data["proposals"][0]["transfer_id"]

    # 2. APPROVE decision
    dec_res = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "APPROVE", "notes": "Approved by district officer"}, headers=headers)
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["status"] == "APPROVED"

    # 3. MARK_DONE decision -> CLOSED
    done_res = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "MARK_DONE"}, headers=headers)
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "CLOSED"


def test_transfer_lifecycle_reject_requires_comment(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    opt_res = client.post("/api/v1/optimize", json={"district_id": "TN-D01"}, headers=headers)
    t_id = opt_res.json()["proposals"][0]["transfer_id"]

    # REJECT without comment -> 422 VALIDATION_ERROR
    dec_res = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "REJECT"}, headers=headers)
    assert dec_res.status_code == 422
    assert dec_res.json()["error"]["code"] == "VALIDATION_ERROR"

    # REJECT with comment -> REJECTED
    dec_res2 = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "REJECT", "notes": "Stock unavailable locally"}, headers=headers)
    assert dec_res2.status_code == 200
    assert dec_res2.json()["status"] == "REJECTED"


def test_transfer_lifecycle_escalate(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    opt_res = client.post("/api/v1/optimize", json={"district_id": "TN-D01"}, headers=headers)
    t_id = opt_res.json()["proposals"][0]["transfer_id"]

    esc_res = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "ESCALATE", "notes": "Requires state clearance"}, headers=headers)
    assert esc_res.status_code == 200
    assert esc_res.json()["status"] == "ESCALATED"


def test_invalid_transitions_return_409(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    opt_res = client.post("/api/v1/optimize", json={"district_id": "TN-D01"}, headers=headers)
    t_id = opt_res.json()["proposals"][0]["transfer_id"]

    # 1. REJECT transfer
    client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "REJECT", "notes": "Rejected"}, headers=headers)

    # 2. REJECTED -> APPROVE -> 409 invalid_transition
    res = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "APPROVE"}, headers=headers)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "invalid_transition"
    assert res.json()["error"]["details"]["state"] == "REJECTED"


def test_modify_revalidates_donor_cover_constraint(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    opt_res = client.post("/api/v1/optimize", json={"district_id": "TN-D01"}, headers=headers)
    t_id = opt_res.json()["proposals"][0]["transfer_id"]

    # Modify with an excessive quantity (e.g. 5000 units) that violates donor cover / vehicle capacity
    mod_res = client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "MODIFY", "modified_qty": 5000}, headers=headers)
    assert mod_res.status_code == 422
    assert mod_res.json()["error"]["code"] == "constraint_violation"


def test_rbac_facility_and_auditor_restrictions(client):
    facility_headers = {"X-Role": "FACILITY", "X-Facility": "TN-PHC-001"}
    auditor_headers = {"X-Role": "AUDITOR"}

    # FACILITY cannot optimize
    res1 = client.post("/api/v1/optimize", json={}, headers=facility_headers)
    assert res1.status_code == 403

    # AUDITOR cannot optimize
    res2 = client.post("/api/v1/optimize", json={}, headers=auditor_headers)
    assert res2.status_code == 403

    # AUDITOR cannot make transfer decision
    res3 = client.post("/api/v1/transfers/TRF-001/decision", json={"action": "APPROVE"}, headers=auditor_headers)
    assert res3.status_code == 403


def test_audit_logging_and_stock_ledger_update(client):
    headers = {"X-Role": "DISTRICT", "X-District": "TN-D01"}
    # 1. Run optimize
    opt_res = client.post("/api/v1/optimize", json={"district_id": "TN-D01"}, headers=headers)
    t_id = opt_res.json()["proposals"][0]["transfer_id"]

    # 2. Approve
    client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "APPROVE"}, headers=headers)

    # 3. Mark done
    client.post(f"/api/v1/transfers/{t_id}/decision", json={"action": "MARK_DONE"}, headers=headers)

    # Verify audit log & DB stock ledger
    db = SessionLocal()
    audit_logs = db.query(AuditLog).all()
    actions = [log.action for log in audit_logs]
    assert "OPTIMIZE_RUN" in actions
    assert "TRANSFER_APPROVE" in actions
    assert "TRANSFER_DONE" in actions

    ledger_recs = db.query(IssuesReceipts).all()
    assert len(ledger_recs) >= 2
    db.close()
