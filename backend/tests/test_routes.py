def test_all_declared_phase1_routes_registered(client):
    headers_state = {"X-Role": "STATE"}
    headers_district = {"X-Role": "DISTRICT"}
    headers_facility = {"X-Role": "FACILITY"}

    # GET /api/v1/health
    assert client.get("/api/v1/health").status_code == 200

    # POST /api/v1/capture/voice
    assert client.post("/api/v1/capture/voice", json={"facility_id": "TN-PHC-014"}, headers=headers_facility).status_code == 200

    # POST /api/v1/capture/photo
    assert client.post("/api/v1/capture/photo", json={"facility_id": "TN-PHC-014"}, headers=headers_facility).status_code == 200

    # POST /api/v1/capture/confirm
    assert client.post("/api/v1/capture/confirm", json={"capture_id": "CAP-01", "items": [{"drug_id": "ORS", "quantity": 10, "confidence": 1.0}]}, headers=headers_facility).status_code == 200

    # GET /api/v1/facilities
    assert client.get("/api/v1/facilities", headers=headers_facility).status_code == 200

    # GET /api/v1/facilities/{facility_id}/status
    assert client.get("/api/v1/facilities/TN-PHC-014/status", headers=headers_facility).status_code == 200

    # GET /api/v1/forecast
    assert client.get("/api/v1/forecast", headers=headers_facility).status_code == 200

    # GET /api/v1/risk
    assert client.get("/api/v1/risk", headers=headers_facility).status_code == 200

    # POST /api/v1/optimize
    assert client.post("/api/v1/optimize", json={}, headers=headers_district).status_code == 200

    # GET /api/v1/transfers
    tr_res = client.get("/api/v1/transfers", headers=headers_facility)
    tr_data = tr_res.json()
    tr_items = tr_data["items"] if isinstance(tr_data, dict) and "items" in tr_data else tr_data
    open_trf = next((t for t in tr_items if t.get("status") == "OPEN"), None)
    target_id = open_trf["transfer_id"] if open_trf else "TRF-001"

    # POST /api/v1/transfers/{transfer_id}/decision
    res_dec = client.post(f"/api/v1/transfers/{target_id}/decision", json={"action": "APPROVE"}, headers=headers_district)
    assert res_dec.status_code in (200, 409)

    # POST /api/v1/copilot/ask
    assert client.post("/api/v1/copilot/ask", json={"prompt": "stock check"}, headers=headers_facility).status_code == 200

    # POST /api/v1/scenario/run
    assert client.post("/api/v1/scenario/run", json={"scenario_type": "MONSOON_SPIKE"}, headers=headers_district).status_code == 200

    # POST /api/v1/federation/round
    assert client.post("/api/v1/federation/round", json={"round_number": 1}, headers=headers_state).status_code == 200

    # GET /api/v1/federation/rounds
    assert client.get("/api/v1/federation/rounds", headers=headers_state).status_code == 200

    # GET /api/v1/alerts
    assert client.get("/api/v1/alerts", headers=headers_facility).status_code == 200

    # GET /api/v1/alerts/{alert_id}/audio
    assert client.get("/api/v1/alerts/ALT-001/audio", headers=headers_facility).status_code == 200

    # GET /api/v1/audit
    assert client.get("/api/v1/audit", headers=headers_district).status_code == 200
