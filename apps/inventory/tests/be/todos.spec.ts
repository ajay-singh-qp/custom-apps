import { NextRequest } from "next/server";

import { logToTerminal } from "../../app/actions";
import { DELETE, PATCH } from "../../app/api/todos/[id]/route";
import { GET, POST } from "../../app/api/todos/route";
import { todos } from "../../app/api/todos/store";

const initialTodos = todos.map((todo) => ({ ...todo }));

beforeEach(() => {
  todos.splice(0, todos.length, ...initialTodos.map((todo) => ({ ...todo })));
});

describe("todo API", () => {
  test("lists todos", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(initialTodos);
  });

  test("creates, updates, and deletes a todo", async () => {
    const createResponse = await POST(
      new NextRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "  Count inventory  " }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    const created = (await createResponse.json()) as { id: string };

    expect(createResponse.status).toBe(201);
    expect(created).toMatchObject({ title: "Count inventory", completed: false });

    const updateResponse = await PATCH(
      new NextRequest(`http://localhost/api/todos/${created.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: created.id }) },
    );

    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({ completed: true });

    const deleteResponse = await DELETE(
      new NextRequest(`http://localhost/api/todos/${created.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: created.id }) },
    );

    expect(deleteResponse.status).toBe(200);
    expect(todos.some((todo) => todo.id === created.id)).toBe(false);
  });

  test("rejects an empty title", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "   " }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Todo title is required.",
    });
  });
});

test("logToTerminal writes to the server console", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

  await logToTerminal();

  expect(log).toHaveBeenCalledWith("Inventory app: terminal log button clicked");
  log.mockRestore();
});
