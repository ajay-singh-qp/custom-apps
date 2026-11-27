import { NextResponse } from "next/server";

import { oauthDisabledResponse } from "@/lib/oauth/disabled";
import { getOauthEnv } from "@/lib/oauth/env";
import { destroySession } from "@/lib/oauth/session";

export async function POST(): Promise<NextResponse> {
  const disabled = oauthDisabledResponse();
  if (disabled) return disabled;
  await destroySession();
  const env = getOauthEnv();
  return NextResponse.redirect(env.hostUrl, { status: 303 });
}

export async function GET(): Promise<NextResponse> {
  return POST();
}
