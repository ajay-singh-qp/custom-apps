import { NextRequest, NextResponse } from "next/server";

import { PUBLIC_ROUTES } from "./lib/oauth/constants";
import { isOauthEnabled } from "./lib/oauth/env";
import { getSession } from "./lib/oauth/session";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // OAuth off (QUESTIONPRO_OAUTH_ENABLED unset): every page is public.
  if (!isOauthEnabled()) {
    return NextResponse.next();
  }
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  const session = await getSession();
  if (!session.user) {
    const loginUrl = new URL("/api/oauth", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
