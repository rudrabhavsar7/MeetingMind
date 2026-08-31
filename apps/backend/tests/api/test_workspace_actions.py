from fastapi.testclient import TestClient


def test_workspace_action_items_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/workspaces/00000000-0000-0000-0000-000000000001/action-items")
    assert response.status_code == 401


def test_workspace_action_items_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/workspaces/{workspace_id}/action-items" in paths
    assert "get" in paths["/api/v1/workspaces/{workspace_id}/action-items"]
