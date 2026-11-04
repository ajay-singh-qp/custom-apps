import { readFileSync } from "fs";
import * as path from "path";

import { NextRequest, NextResponse } from "next/server";

import { GET as oauthCallbackGet } from "../../../app/api/oauth/callback/route";
import { GET as oauthStartGet } from "../../../app/api/oauth/route";
import {
  GET as logoutGet,
  POST as logoutPost,
} from "../../../app/api/logout/route";
import { isOauthEnabled } from "../../../lib/oauth/env";
import { getSession } from "../../../lib/oauth/session";
import { resolveShellUser } from "../../../lib/oauth/shell-user";
import type { IOauthUser } from "../../../lib/oauth/types";
import { middleware } from "../../../middleware";

jest.mock("../../../lib/oauth/session", () => ({
  getSession: jest.fn(),
  destroySession: jest.fn(),
}));

const FLAG = "QUESTIONPRO_OAUTH_ENABLED";
const OAUTH_ENV_KEYS = [
  FLAG,
  "SESSION_PASSWORD",
  "QUESTIONPRO_OAUTH_CLIENT_ID",
  "QUESTIONPRO_OAUTH_HOST_URL",
  "QUESTIONPRO_OAUTH_ENCRYPTION_KEY",
  "QUESTIONPRO_OAUTH_SUCCESS_REDIRECT_URL",
  "QUESTIONPRO_OAUTH_REDIRECT_URI",
];
const APP_ORIGIN = "http://myapp.local.custom-apps.test";
const PROTECTED_PATH = `${APP_ORIGIN}/`;
const DISABLED_STATUS = 404;
const DISABLED_BODY = { error: "oauth_disabled" };
const STUB_USER = { firstName: "Alice", lastName: "Doe" } as IOauthUser;

const mockedGetSession = getSession as jest.Mock;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of OAUTH_ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  mockedGetSession.mockReset();
});

afterEach(() => {
  for (const key of OAUTH_ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("QUESTIONPRO_OAUTH_ENABLED flag", () => {
  test.each([
    { value: undefined, expected: false },
    { value: "", expected: false },
    { value: "false", expected: false },
    { value: "TRUE", expected: false },
    { value: "1", expected: false },
    { value: "true", expected: true },
  ])("isOauthEnabled() is $expected for $value", ({ value, expected }) => {
    if (value !== undefined) process.env[FLAG] = value;
    expect(isOauthEnabled()).toBe(expected);
  });

  test("the root layout renders per request, so the flag is read at runtime and never baked in at build", () => {
    const layout = readFileSync(
      path.join(__dirname, "../../../app/layout.tsx"),
      "utf-8",
    );
    expect(layout).toMatch(
      /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/,
    );
  });

  describe("with OAuth disabled (no OAuth env at all)", () => {
    test("the middleware lets a protected page through without touching the session", async () => {
      const response = await middleware(new NextRequest(PROTECTED_PATH));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(mockedGetSession).not.toHaveBeenCalled();
    });

    test.each([
      {
        route: "GET /api/oauth",
        call: (): Promise<NextResponse> =>
          oauthStartGet(new NextRequest(`${APP_ORIGIN}/api/oauth`)),
      },
      {
        route: "GET /api/oauth/callback",
        call: (): Promise<NextResponse> =>
          oauthCallbackGet(
            new NextRequest(`${APP_ORIGIN}/api/oauth/callback?code=c&state=s`),
          ),
      },
      {
        route: "POST /api/logout",
        call: (): Promise<NextResponse> => logoutPost(),
      },
      {
        route: "GET /api/logout",
        call: (): Promise<NextResponse> => logoutGet(),
      },
    ])("$route answers 404 oauth_disabled", async ({ call }) => {
      const response = await call();
      expect(response.status).toBe(DISABLED_STATUS);
      await expect(response.json()).resolves.toEqual(DISABLED_BODY);
    });

    test("the layout renders without a user", async () => {
      await expect(resolveShellUser()).resolves.toBeNull();
      expect(mockedGetSession).not.toHaveBeenCalled();
    });
  });

  describe("with OAuth enabled", () => {
    beforeEach(() => {
      process.env[FLAG] = "true";
    });

    test("the middleware redirects a protected page to /api/oauth when there is no session user", async () => {
      mockedGetSession.mockResolvedValue({});
      const response = await middleware(new NextRequest(PROTECTED_PATH));
      expect(response.headers.get("location")).toBe(`${APP_ORIGIN}/api/oauth`);
    });

    test("the middleware lets a signed-in user through", async () => {
      mockedGetSession.mockResolvedValue({ user: STUB_USER });
      const response = await middleware(new NextRequest(PROTECTED_PATH));
      expect(response.headers.get("location")).toBeNull();
    });

    test("the layout gets the session user", async () => {
      mockedGetSession.mockResolvedValue({ user: STUB_USER });
      await expect(resolveShellUser()).resolves.toBe(STUB_USER);
    });

    test("the layout fails loudly when the middleware let a request through without a user", async () => {
      mockedGetSession.mockResolvedValue({});
      await expect(resolveShellUser()).rejects.toThrow(
        "Session user missing — middleware wiring broken",
      );
    });
  });
});
