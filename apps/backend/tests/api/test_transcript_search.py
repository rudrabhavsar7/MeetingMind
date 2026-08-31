from fastapi.testclient import TestClient


def test_transcript_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript"
    )
    assert response.status_code == 401


def test_transcript_search_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript/search",
        params={"q": "hello"},
    )
    assert response.status_code == 401


def test_transcript_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript" in paths
    assert "get" in paths["/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript"]


def test_transcript_search_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript/search" in paths
    assert "get" in paths["/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript/search"]
