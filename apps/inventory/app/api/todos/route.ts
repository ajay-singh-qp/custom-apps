import { NextRequest, NextResponse } from "next/server";

import { proxyTodoRequest } from "./proxy";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyTodoRequest(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return proxyTodoRequest(request);
}
