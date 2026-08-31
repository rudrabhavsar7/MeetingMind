from unittest.mock import patch

from fastapi.testclient import TestClient


def test_worker_health(client: TestClient) -> None:
    response = client.get("/api/v1/worker/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "MeetingMind Worker"


def test_trigger_ping_returns_task_id(client: TestClient) -> None:
    with patch("app.tasks.ping.ping_task") as mock_task:
        mock_result = type("FakeResult", (), {"id": "test-task-123"})()
        mock_task.delay.return_value = mock_result

        response = client.post("/api/v1/worker/ping")

        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "test-task-123"
        assert data["status"] == "queued"
        mock_task.delay.assert_called_once()


def test_worker_health_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/worker/health" in paths
    assert "/api/v1/worker/ping" in paths
