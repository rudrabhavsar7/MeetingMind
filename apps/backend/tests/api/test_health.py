from fastapi.testclient import TestClient


def test_root_health(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "X-Request-ID" in response.headers


def test_v1_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "MeetingMind API"}


def test_docs_are_available(client: TestClient) -> None:
    response = client.get("/docs")

    assert response.status_code == 200


def test_configured_frontend_origin_is_allowed(client: TestClient) -> None:
    response = client.options(
        "/api/v1/auth/bootstrap-status",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"
    assert response.headers["Access-Control-Allow-Credentials"] == "true"


def test_unconfigured_origin_is_not_allowed(client: TestClient) -> None:
    response = client.get(
        "/health",
        headers={"Origin": "https://untrusted.example"},
    )

    assert "Access-Control-Allow-Origin" not in response.headers
