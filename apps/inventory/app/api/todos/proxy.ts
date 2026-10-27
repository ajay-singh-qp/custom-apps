import { NextRequest, NextResponse } from "next/server";

const DEFAULT_FASTAPI_URL = "http://127.0.0.1:8000";

export async function proxyTodoRequest(
  request: NextRequest,
  todoId?: string,
): Promise<NextResponse> {
  const backendUrl = process.env.FASTAPI_URL ?? DEFAULT_FASTAPI_URL;
  const path = todoId ? `/api/todos/${encodeURIComponent(todoId)}` : "/api/todos";
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }
  headers.set("accept", "application/json");

  try {
    const response = await fetch(new URL(path, backendUrl), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }

    console.info(
      `Inventory frontend proxy method=${request.method} path=${path} status=${response.status}`,
    );

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Inventory FastAPI request failed", error);
    return NextResponse.json(
      { error: "Inventory backend is unavailable." },
      { status: 502 },
    );
  }
}
