import { isOauthEnabled } from "./env";
import { getSession } from "./session";
import type { IOauthUser } from "./types";

const MISSING_USER_ERROR = "Session user missing — middleware wiring broken";

/**
 * The user the app shell shows: `null` while OAuth is off; otherwise the
 * session user. The middleware guarantees a user on every rendered page when
 * OAuth is on, so a missing one means the wiring is broken — fail loud.
 */
export async function resolveShellUser(): Promise<IOauthUser | null> {
  if (!isOauthEnabled()) return null;
  const session = await getSession();
  if (!session.user) {
    throw new Error(MISSING_USER_ERROR);
  }
  return session.user;
}
