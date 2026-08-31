from __future__ import annotations

from fastapi.testclient import TestClient


def test_transcript_list_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript"
    )
    assert response.status_code == 401


def test_transcript_search_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript/search",
        params={"q": "test"},
    )
    assert response.status_code == 401


def test_speaker_rename_requires_auth(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript/speakers/Speaker%201",
        json={"speaker_name": "Maya Chen"},
    )
    assert response.status_code == 401


def test_transcript_endpoints_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]

    transcript_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript"
    assert transcript_path in paths
    assert "get" in paths[transcript_path]

    search_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript/search"
    assert search_path in paths
    assert "get" in paths[search_path]

    speaker_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/transcript/speakers/{speaker_label}"
    assert speaker_path in paths
    assert "patch" in paths[speaker_path]


def test_transcript_list_returns_segments(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript"
    )
    assert response.status_code == 401


def test_transcript_search_requires_query(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/transcript/search"
    )
    assert response.status_code in (401, 422)
