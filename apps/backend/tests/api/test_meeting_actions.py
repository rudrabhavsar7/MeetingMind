from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def test_action_items_requires_auth(client: TestClient) -> None:
    response = client.get(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/action-items"
    )
    assert response.status_code == 401


def test_decisions_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/decisions")
    assert response.status_code == 401


def test_summaries_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/summaries")
    assert response.status_code == 401


def test_regenerate_summary_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/summaries/regenerate",
        json={"reason": "user_requested"},
    )
    assert response.status_code == 401


def test_ai_feedback_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/ai-feedback",
        json={"output_type": "summary_version", "output_id": str(uuid.uuid4()), "rating": "up"},
    )
    assert response.status_code == 401


def test_action_items_update_requires_auth(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/meetings/00000000-0000-0000-0000-000000000099/action-items/00000000-0000-0000-0000-000000000099",
        json={"status": "completed"},
    )
    assert response.status_code == 401


def test_meeting_actions_endpoints_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]

    actions_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/action-items"
    assert actions_path in paths
    assert "get" in paths[actions_path]

    decisions_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/decisions"
    assert decisions_path in paths

    summaries_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/summaries"
    assert summaries_path in paths

    feedback_path = "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/ai-feedback"
    assert feedback_path in paths
