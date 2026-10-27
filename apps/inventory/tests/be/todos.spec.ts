import { NextRequest } from "next/server";

import { logToTerminal } from "../../app/actions";
import { DELETE, PATCH } from "../../app/api/todos/[id]/route";
import { GET, POST } from "../../app/api/todos/route";

describe("FastAPI todo proxy", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("forwards list responses from FastAPI", async () => {
    const todos = [{ id: "todo-1", title: "Count inventory", completed: false }];
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      Response.json(todos, { status: 200 }),
    );

    const response = await GET(
      new NextRequest("http://localhost/api/todos"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(todos);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://127.0.0.1:8000/api/todos"),
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  test("forwards create and update bodies", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(Response.json({ id: "todo-1" }, { status: 201 }));
    const createBody = JSON.stringify({ title: "Count inventory" });

    const createResponse = await POST(
      new NextRequest("http://localhost/api/todos", {
        method: "POST",
        body: createBody,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(createResponse.status).toBe(201);
    expect(fetchMock).toHaveBeenLastCalledWith(
      new URL("http://127.0.0.1:8000/api/todos"),
      expect.objectContaining({
        method: "POST",
        body: expect.any(ArrayBuffer),
      }),
    );

    fetchMock.mockResolvedValue(
      Response.json({ id: "todo-1", completed: true }),
    );
    const updateResponse = await PATCH(
      new NextRequest("http://localhost/api/todos/todo-1", {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );

    expect(updateResponse.status).toBe(200);
    expect(fetchMock).toHaveBeenLastCalledWith(
      new URL("http://127.0.0.1:8000/api/todos/todo-1"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  test("forwards empty delete responses", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const response = await DELETE(
      new NextRequest("http://localhost/api/todos/todo-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  test("returns 502 when FastAPI is unavailable", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("connection refused"));

    const response = await GET(
      new NextRequest("http://localhost/api/todos"),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Inventory backend is unavailable.",
    });
  });
});

test("logToTerminal writes to the server console", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

  await logToTerminal();

  expect(log).toHaveBeenCalledWith("Inventory app: terminal log button clicked");
  log.mockRestore();
});
