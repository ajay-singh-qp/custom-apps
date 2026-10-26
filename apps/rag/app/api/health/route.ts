import { NextResponse } from "next/server";

// Liveness probe for the platform's deploy agent (Docker healthcheck on
// http://127.0.0.1:3000/api/health). Deliberately no DB check: a database
// blip must not flip the container to unhealthy and break a deploy swap.
// Public — listed in PUBLIC_ROUTES so the OAuth middleware lets it through.
export function GET(): NextResponse {
  return NextResponse.json({ status: "ok" });
}

// Never statically cached: every probe must hit the running server.
export const dynamic = "force-dynamic";
