import { NextRequest, NextResponse } from "next/server";

import { todos, type Todo } from "./store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(todos);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as
    | { title?: unknown; completed?: unknown }
    | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const completed = body?.completed;

  if (!title) {
    return NextResponse.json(
      { error: "Todo title is required." },
      { status: 400 },
    );
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "Todo completed state must be a boolean." },
      { status: 400 },
    );
  }

  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: completed ?? false,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(todo);

  return NextResponse.json(todo, { status: 201 });
}
