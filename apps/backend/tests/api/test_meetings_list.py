from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def test_meetings_list_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings")
    assert response.status_code == 401


def test_meeting_detail_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099"
    )
    assert response.status_code == 401


def test_delete_meeting_requires_auth(client: TestClient) -> None:
    response = client.delete(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099"
    )
    assert response.status_code == 401


def test_meetings_endpoints_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]

    meetings_path = "/api/v1/workspaces/{workspace_id}/meetings"
    assert meetings_path in paths
    assert "get" in paths[meetings_path]
    assert "delete" not in paths[meetings_path]  # delete is on /{meeting_id}

    detail_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}"
    assert detail_path in paths
    assert "get" in paths[detail_path]
    assert "delete" in paths[detail_path]


def test_list_meetings_response_schema(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    schema = response.json()

    meetings_get = schema["paths"]["/api/v1/workspaces/{workspace_id}/meetings"]["get"]
    assert meetings_get["summary"] != ""


def test_delete_meeting_response_code(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    schema = response.json()

    detail_path = schema["paths"]["/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}"]
    delete_op = detail_path["delete"]
    assert "204" in delete_op["responses"]
