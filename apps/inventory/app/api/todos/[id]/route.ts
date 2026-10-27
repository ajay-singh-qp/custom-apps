import { NextRequest, NextResponse } from "next/server";

import { proxyTodoRequest } from "../proxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyTodoRequest(request, id);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  return proxyTodoRequest(request, id);
}
