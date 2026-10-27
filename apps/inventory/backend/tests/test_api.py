"""Integration tests for the inventory API."""

from collections.abc import AsyncIterator

import httpx
import pytest

from app import main


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    application = main.create_app()
    transport = httpx.ASGITransport(app=application)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as test_client:
        yield test_client


async def test_health(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_todo_crud(client: httpx.AsyncClient) -> None:
    create_response = await client.post(
        "/api/todos",
        json={"title": "  Count inventory  "},
    )
    created = create_response.json()

    assert create_response.status_code == 201
    assert created["title"] == "Count inventory"
    assert created["completed"] is False

    list_response = await client.get("/api/todos")
    assert list_response.json() == [created]

    get_response = await client.get(f"/api/todos/{created['id']}")
    assert get_response.json() == created

    update_response = await client.patch(
        f"/api/todos/{created['id']}",
        json={"completed": True},
    )
    assert update_response.status_code == 200
    assert update_response.json()["completed"] is True

    delete_response = await client.delete(f"/api/todos/{created['id']}")
    assert delete_response.status_code == 204
    assert delete_response.content == b""

    missing_response = await client.get(f"/api/todos/{created['id']}")
    assert missing_response.status_code == 404


async def test_rejects_empty_title(client: httpx.AsyncClient) -> None:
    response = await client.post("/api/todos", json={"title": "   "})

    assert response.status_code == 422
