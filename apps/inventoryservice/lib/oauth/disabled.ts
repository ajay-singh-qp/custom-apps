import { NextResponse } from "next/server";

import { OAUTH_DISABLED_ERROR, OAUTH_DISABLED_STATUS } from "./constants";
import { isOauthEnabled } from "./env";

/**
 * The response every OAuth route returns while OAuth is off, or `null` when
 * it is on. Checked before any OAuth env is read, so the routes work with no
 * OAuth configuration at all.
 */
export function oauthDisabledResponse(): NextResponse | null {
  if (isOauthEnabled()) return null;
  return NextResponse.json(
    { error: OAUTH_DISABLED_ERROR },
    { status: OAUTH_DISABLED_STATUS },
  );
}
