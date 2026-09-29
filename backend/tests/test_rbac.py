def test_auditor_cannot_capture(client):
    headers = {"X-Role": "AUDITOR"}
    payload = {"audio_base64": "test", "facility_id": "TN-PHC-014"}
    res = client.post("/api/v1/capture/voice", json=payload, headers=headers)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_facility_cannot_optimize(client):
    headers = {"X-Role": "FACILITY"}
    res = client.post("/api/v1/optimize", json={}, headers=headers)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_facility_cannot_decide_transfer(client):
    headers = {"X-Role": "FACILITY"}
    payload = {"action": "APPROVE"}
    res = client.post("/api/v1/transfers/TRF-001/decision", json=payload, headers=headers)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_state_can_run_federation_round(client):
    headers = {"X-Role": "STATE"}
    payload = {"round_number": 2}
    res = client.post("/api/v1/federation/round", json=payload, headers=headers)
    assert res.status_code == 200


def test_non_state_cannot_run_federation_round(client):
    for role in ["FACILITY", "BLOCK", "DISTRICT", "AUDITOR"]:
        headers = {"X-Role": role}
        res = client.post("/api/v1/federation/round", json={"round_number": 2}, headers=headers)
        assert res.status_code == 403


def test_auditor_and_state_can_read_federation_history(client):
    for role in ["STATE", "AUDITOR"]:
        headers = {"X-Role": role}
        res = client.get("/api/v1/federation/rounds", headers=headers)
        assert res.status_code == 200


def test_district_can_view_audit_logs(client):
    headers = {"X-Role": "DISTRICT"}
    res = client.get("/api/v1/audit", headers=headers)
    assert res.status_code == 200


def test_facility_cannot_view_audit_logs(client):
    headers = {"X-Role": "FACILITY"}
    res = client.get("/api/v1/audit", headers=headers)
    assert res.status_code == 403


def test_alert_audio_rbac_all_roles_allowed(client):
    for role in ["FACILITY", "BLOCK", "DISTRICT", "STATE", "AUDITOR"]:
        headers = {"X-Role": role}
        res = client.get("/api/v1/alerts/ALT-001/audio", headers=headers)
        assert res.status_code == 200

