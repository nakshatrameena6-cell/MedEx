def test_404_not_found(client):
    response = client.get("/api/v1/nonexistent_route")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_ERROR"


def test_422_validation_error(client):
    headers = {"X-Role": "FACILITY"}
    # POST to capture confirm with invalid empty payload
    response = client.post("/api/v1/capture/confirm", json={}, headers=headers)
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]
