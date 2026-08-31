from fastapi.testclient import TestClient


def test_media_url_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/media-url"
    )
    assert response.status_code == 401


def test_export_markdown_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/exports/markdown"
    )
    assert response.status_code == 401


def test_media_url_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/media-url" in paths
    assert "get" in paths["/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/media-url"]


def test_export_markdown_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/exports/markdown" in paths
    assert "get" in paths["/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/exports/markdown"]
