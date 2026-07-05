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
