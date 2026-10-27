"""HTTP routes for todo operations."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status

from app import models, service

router = APIRouter(prefix="/api/todos", tags=["todos"])


def get_todo_service(request: Request) -> service.TodoService:
    """Returns the application-scoped todo service."""
    return request.app.state.todo_service


TodoServiceDependency = Annotated[
    service.TodoService,
    Depends(get_todo_service),
]


@router.get("", response_model=list[models.Todo])
async def list_todos(
    todo_service: TodoServiceDependency,
) -> list[models.Todo]:
    """Lists all todos."""
    return todo_service.list()


@router.get("/{todo_id}", response_model=models.Todo)
async def get_todo(
    todo_id: UUID,
    todo_service: TodoServiceDependency,
) -> models.Todo:
    """Gets one todo."""
    return todo_service.get(todo_id)


@router.post(
    "",
    response_model=models.Todo,
    status_code=status.HTTP_201_CREATED,
)
async def create_todo(
    data: models.TodoCreate,
    todo_service: TodoServiceDependency,
) -> models.Todo:
    """Creates a todo."""
    return todo_service.create(data)


@router.patch("/{todo_id}", response_model=models.Todo)
async def update_todo(
    todo_id: UUID,
    data: models.TodoUpdate,
    todo_service: TodoServiceDependency,
) -> models.Todo:
    """Partially updates a todo."""
    return todo_service.update(todo_id, data)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: UUID,
    todo_service: TodoServiceDependency,
) -> Response:
    """Deletes a todo."""
    todo_service.delete(todo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
