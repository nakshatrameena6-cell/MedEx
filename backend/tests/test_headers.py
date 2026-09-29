def test_valid_headers(client):
    headers = {
        "X-Role": "DISTRICT",
        "X-District": "TN-D01",
        "X-User": "test_user_01"
    }
    response = client.get("/api/v1/facilities", headers=headers)
    assert response.status_code == 200


def test_invalid_role_header(client):
    headers = {"X-Role": "INVALID_ROLE"}
    response = client.get("/api/v1/facilities", headers=headers)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "INVALID_HEADER"


def test_state_role_district_override(client):
    headers = {"X-Role": "STATE", "X-User": "state_officer"}
    response = client.get("/api/v1/facilities", headers=headers)
    assert response.status_code == 200
