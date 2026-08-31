from fastapi.testclient import TestClient


def test_rag_chat_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/api/v1/workspaces/00000000-0000-0000-0000-000000000001/rag/chat",
        json={"question": "What was discussed?"},
    )
    assert response.status_code == 401


def test_rag_chat_in_openapi(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/workspaces/{workspace_id}/rag/chat" in paths
    assert "post" in paths["/api/v1/workspaces/{workspace_id}/rag/chat"]
