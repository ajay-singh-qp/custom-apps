"""Business logic for todo operations."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app import models, repository


class TodoService:
    """Coordinates todo validation and persistence."""

    def __init__(self, todo_repository: repository.TodoRepository) -> None:
        self._repository = todo_repository

    def list(self) -> list[models.Todo]:
        """Returns all todos."""
        return self._repository.list()

    def get(self, todo_id: UUID) -> models.Todo:
        """Returns a todo or raises a not-found response."""
        todo = self._repository.get(todo_id)
        if todo is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
        return todo

    def create(self, data: models.TodoCreate) -> models.Todo:
        """Creates a todo."""
        now = datetime.now(timezone.utc)
        todo = models.Todo(
            id=uuid4(),
            title=data.title,
            completed=data.completed,
            created_at=now,
            updated_at=now,
        )
        return self._repository.save(todo)

    def update(
        self,
        todo_id: UUID,
        data: models.TodoUpdate,
    ) -> models.Todo:
        """Updates fields supplied for an existing todo."""
        todo = self.get(todo_id)
        changes = data.model_dump(exclude_none=True, exclude_unset=True)
        updated = todo.model_copy(
            update={**changes, "updated_at": datetime.now(timezone.utc)},
        )
        return self._repository.save(updated)

    def delete(self, todo_id: UUID) -> None:
        """Deletes a todo or raises a not-found response."""
        if not self._repository.delete(todo_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
