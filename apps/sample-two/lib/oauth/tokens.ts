import { OAUTH_TOKEN_PATH } from "./constants";
import type { IOauthTokenResponse } from "./types";

const TOKEN_ERROR_PREFIX = "Token exchange failed";
const REFRESH_ERROR_PREFIX = "Token refresh failed";

async function postToken(
  url: string,
  body: URLSearchParams,
  errorPrefix: string,
): Promise<IOauthTokenResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    throw new Error(
      `${errorPrefix}: network error - ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!response.ok) {
    throw new Error(`${errorPrefix}: status ${response.status}`);
  }
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (err) {
    throw new Error(
      `${errorPrefix}: invalid JSON - ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const typed = parsed as IOauthTokenResponse;
  if (!typed.access_token) {
    throw new Error(`${errorPrefix}: response missing access_token`);
  }
  return typed;
}

export async function exchangeCodeForTokens(
  host: string,
  code: string,
  clientId: string,
  redirectUri: string,
): Promise<IOauthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });
  return postToken(`${host}${OAUTH_TOKEN_PATH}`, body, TOKEN_ERROR_PREFIX);
}

export async function refreshAccessToken(
  host: string,
  refreshToken: string,
  clientId: string,
): Promise<IOauthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  return postToken(`${host}${OAUTH_TOKEN_PATH}`, body, REFRESH_ERROR_PREFIX);
}
