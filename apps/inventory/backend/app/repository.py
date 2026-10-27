"""Thread-safe in-memory storage for todos."""

import threading
from typing import Optional
from uuid import UUID

from app import models


class TodoRepository:
    """Stores todos for the lifetime of the application process."""

    def __init__(self) -> None:
        self._todos: dict[UUID, models.Todo] = {}
        self._lock = threading.RLock()

    def list(self) -> list[models.Todo]:
        """Returns all todos, newest first."""
        with self._lock:
            return sorted(
                self._todos.values(),
                key=lambda todo: todo.created_at,
                reverse=True,
            )

    def get(self, todo_id: UUID) -> Optional[models.Todo]:
        """Returns one todo when it exists."""
        with self._lock:
            return self._todos.get(todo_id)

    def save(self, todo: models.Todo) -> models.Todo:
        """Creates or replaces a todo."""
        with self._lock:
            self._todos[todo.id] = todo
            return todo

    def delete(self, todo_id: UUID) -> bool:
        """Deletes a todo and reports whether it existed."""
        with self._lock:
            return self._todos.pop(todo_id, None) is not None
