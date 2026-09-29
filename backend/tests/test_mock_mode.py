def test_mock_header_present_on_success(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.headers.get("X-Mock") == "true"


def test_mock_header_present_on_rbac_error(client):
    headers = {"X-Role": "AUDITOR"}
    res = client.post("/api/v1/capture/voice", json={"facility_id": "TN-PHC-014"}, headers=headers)
    assert res.status_code == 403
    assert res.headers.get("X-Mock") == "true"


def test_mock_header_present_on_validation_error(client):
    res = client.post("/api/v1/capture/confirm", json={})
    assert res.status_code == 422
    assert res.headers.get("X-Mock") == "true"
