def test_openapi_schema(client):
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "MedEx API"
    assert data["info"]["version"] == "1.1.0"
    paths = data["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/facilities" in paths
    assert "/api/v1/forecast" in paths


def test_docs_page(client):
    response = client.get("/docs")
    assert response.status_code == 200
