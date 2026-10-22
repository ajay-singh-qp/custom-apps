import {
  OAUTH_ENABLED_ENV,
  OAUTH_ENABLED_VALUE,
  SESSION_PASSWORD_MIN_LENGTH,
} from "./constants";

interface IOauthEnv {
  clientId: string;
  hostUrl: string;
  encryptionKey: string;
  successRedirectUrl: string;
  redirectUri: string;
  sessionPassword: string;
  sessionCookieName: string;
}

const DEFAULT_COOKIE_NAME = "qp_session";

function readRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * True only when `QUESTIONPRO_OAUTH_ENABLED` is exactly "true". Bracket access
 * keeps Next.js from inlining the value into middleware at build time: the
 * platform sets env when the container starts.
 */
export function isOauthEnabled(): boolean {
  return process.env[OAUTH_ENABLED_ENV] === OAUTH_ENABLED_VALUE;
}

/** Reads the OAuth env. Only call it when `isOauthEnabled()` is true. */
export function getOauthEnv(): IOauthEnv {
  const sessionPassword = readRequired("SESSION_PASSWORD");
  if (sessionPassword.length < SESSION_PASSWORD_MIN_LENGTH) {
    throw new Error(
      `SESSION_PASSWORD must be at least ${SESSION_PASSWORD_MIN_LENGTH} characters`,
    );
  }
  return {
    clientId: readRequired("QUESTIONPRO_OAUTH_CLIENT_ID"),
    hostUrl: readRequired("QUESTIONPRO_OAUTH_HOST_URL"),
    encryptionKey: readRequired("QUESTIONPRO_OAUTH_ENCRYPTION_KEY"),
    successRedirectUrl: readRequired("QUESTIONPRO_OAUTH_SUCCESS_REDIRECT_URL"),
    redirectUri: readRequired("QUESTIONPRO_OAUTH_REDIRECT_URI"),
    sessionPassword,
    sessionCookieName:
      process.env["SESSION_COOKIE_NAME"] ?? DEFAULT_COOKIE_NAME,
  };
}
