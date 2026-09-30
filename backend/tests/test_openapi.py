def test_openapi_schema(client):
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "MedEx API"
    assert data["info"]["version"] == "1.1.0"
    paths = data["paths"]
    
    expected_paths = [
        "/api/v1/health",
        "/api/v1/capture/voice",
        "/api/v1/capture/photo",
        "/api/v1/capture/confirm",
        "/api/v1/facilities",
        "/api/v1/facilities/{facility_id}/status",
        "/api/v1/forecast",
        "/api/v1/risk",
        "/api/v1/optimize",
        "/api/v1/transfers",
        "/api/v1/transfers/{transfer_id}/decision",
        "/api/v1/copilot/ask",
        "/api/v1/scenario/run",
        "/api/v1/federation/round",
        "/api/v1/federation/rounds",
        "/api/v1/alerts",
        "/api/v1/alerts/{alert_id}/audio",
        "/api/v1/audit"
    ]
    for p in expected_paths:
        assert p in paths, f"Path {p} missing from OpenAPI specification"
    
    assert len(expected_paths) == 18


def test_docs_page(client):
    response = client.get("/docs")
    assert response.status_code == 200
