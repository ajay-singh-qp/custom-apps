import { NextRequest, NextResponse } from "next/server";

import { todos, type Todo } from "../todos/store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const index = todos.findIndex((todo) => todo.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { title?: string; completed?: boolean }
    | null;

  const current = todos[index];
  const updatedTodo: Todo = {
    ...current,
    title:
      typeof body?.title === "string"
        ? body.title.trim() || current.title
        : current.title,
    completed:
      typeof body?.completed === "boolean" ? body.completed : current.completed,
  };

  todos[index] = updatedTodo;

  return NextResponse.json(updatedTodo);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const index = todos.findIndex((todo) => todo.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  todos.splice(index, 1);

  return NextResponse.json({ success: true, deletedId: id });
}
