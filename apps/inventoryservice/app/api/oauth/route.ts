import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  APP_ORIGIN_QUERY_PARAM,
  OAUTH_AUTHORIZE_PATH,
} from "@/lib/oauth/constants";
import { oauthDisabledResponse } from "@/lib/oauth/disabled";
import { getOauthEnv } from "@/lib/oauth/env";
import { encryptState } from "@/lib/oauth/state";
import { validateQpHost } from "@/lib/oauth/urlValidator";

const NONCE_BYTES = 16;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const disabled = oauthDisabledResponse();
  if (disabled) return disabled;
  const env = getOauthEnv();
  const requestedOrigin = request.nextUrl.searchParams.get(
    APP_ORIGIN_QUERY_PARAM,
  );
  const appOrigin =
    requestedOrigin && validateQpHost(requestedOrigin)
      ? requestedOrigin
      : env.hostUrl;
  const state = encryptState(
    { appOrigin, nonce: randomBytes(NONCE_BYTES).toString("hex") },
    env.encryptionKey,
  );
  const authorizationUrl = new URL(`${appOrigin}${OAUTH_AUTHORIZE_PATH}`);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", env.clientId);
  authorizationUrl.searchParams.set("redirect_uri", env.redirectUri);
  authorizationUrl.searchParams.set("state", state);
  return NextResponse.redirect(authorizationUrl.toString());
}
