"""Pydantic models for todo API requests and responses."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TodoCreate(BaseModel):
    """Input accepted when creating a todo."""

    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200)
    completed: bool = False


class TodoUpdate(BaseModel):
    """Fields that may be changed on an existing todo."""

    model_config = ConfigDict(str_strip_whitespace=True)

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    completed: Optional[bool] = None


class Todo(BaseModel):
    """Todo returned by the API."""

    id: UUID
    title: str
    completed: bool
    created_at: datetime
    updated_at: datetime
