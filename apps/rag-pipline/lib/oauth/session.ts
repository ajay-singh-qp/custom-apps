import { getIronSession } from "iron-session";
import type { IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import { getOauthEnv } from "./env";
import type { IOauthUser } from "./types";

export interface ISessionData {
  user?: IOauthUser;
}

function sessionOptions(): SessionOptions {
  const env = getOauthEnv();
  return {
    password: env.sessionPassword,
    cookieName: env.sessionCookieName,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getSession(): Promise<IronSession<ISessionData>> {
  const cookieStore = await cookies();
  return getIronSession<ISessionData>(cookieStore, sessionOptions());
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
