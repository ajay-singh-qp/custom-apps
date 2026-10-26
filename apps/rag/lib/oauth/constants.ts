// Mirrors the paths used by @npm-questionpro/questionpro-global-oauth's
// internal QuestionProOauthApiService — kept in lockstep.
export const OAUTH_AUTHORIZE_PATH = "/a/oauth2/authorize";
export const OAUTH_TOKEN_PATH = "/a/oauth2/token";
export const OAUTH_ME_PATH = "/a/oauth2/me";

// Query-param name used to carry the QuestionPro data-center override.
export const APP_ORIGIN_QUERY_PARAM = "appOrigin";

// AES-256-GCM; the package enforces the same.
export const STATE_CIPHER_ALGORITHM = "aes-256-gcm";
export const STATE_IV_LENGTH_BYTES = 12;
export const STATE_ENCRYPTION_KEY_BYTES = 32;

// Feature flag: OAuth runs only when this env var is exactly "true". Off by
// default until the platform can register a callback URL per tenant app.
export const OAUTH_ENABLED_ENV = "QUESTIONPRO_OAUTH_ENABLED";
export const OAUTH_ENABLED_VALUE = "true";
// What the OAuth routes answer while the flag is off.
export const OAUTH_DISABLED_STATUS = 404;
export const OAUTH_DISABLED_ERROR = "oauth_disabled";

// iron-session minimum.
export const SESSION_PASSWORD_MIN_LENGTH = 32;

// Routes exempt from auth middleware. `/api/health` is probed by the
// platform's deploy agent (Docker healthcheck) without a session.
export const PUBLIC_ROUTES: readonly string[] = [
  "/api/oauth",
  "/api/oauth/callback",
  "/api/logout",
  "/api/health",
];
