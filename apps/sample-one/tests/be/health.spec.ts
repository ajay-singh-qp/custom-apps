import { NextRequest } from "next/server";

import { GET } from "../../app/api/health/route";
import { middleware } from "../../middleware";

describe("GET /api/health", () => {
  test("returns 200 with status ok", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  test("is reachable without a session (the deploy healthcheck has no cookie)", async () => {
    const request = new NextRequest("http://127.0.0.1:3000/api/health");
    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
