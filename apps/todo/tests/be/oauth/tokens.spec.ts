import {
  exchangeCodeForTokens,
  refreshAccessToken,
} from "../../../lib/oauth/tokens";

const HOST = "https://www.questionpro.com";
const CLIENT_ID = "client-id-abc";
const REDIRECT_URI = "http://localhost:3000/api/oauth/callback";
const CODE = "authorization-code";
const REFRESH = "refresh-token-abc";

function mockFetchResponse(init: {
  ok: boolean;
  status?: number;
  json?: unknown;
  rejects?: Error;
  invalidJson?: boolean;
}): void {
  if (init.rejects) {
    global.fetch = jest.fn().mockRejectedValue(init.rejects) as never;
    return;
  }
  global.fetch = jest.fn().mockResolvedValue({
    ok: init.ok,
    status: init.status ?? 200,
    json: init.invalidJson
      ? jest.fn().mockRejectedValue(new Error("not json"))
      : jest.fn().mockResolvedValue(init.json),
  }) as never;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("exchangeCodeForTokens", () => {
  test("happy path returns parsed token response", async () => {
    mockFetchResponse({
      ok: true,
      json: {
        access_token: "access",
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 1200,
        dc: "www",
      },
    });
    const result = await exchangeCodeForTokens(
      HOST,
      CODE,
      CLIENT_ID,
      REDIRECT_URI,
    );
    expect(result.access_token).toBe("access");
    expect(result.refresh_token).toBe("refresh");
  });

  test('network error throws with "network error" prefix', async () => {
    mockFetchResponse({ ok: false, rejects: new Error("ECONNREFUSED") });
    await expect(
      exchangeCodeForTokens(HOST, CODE, CLIENT_ID, REDIRECT_URI),
    ).rejects.toThrow(/network error/);
  });

  test("non-200 response throws with status", async () => {
    mockFetchResponse({ ok: false, status: 400, json: {} });
    await expect(
      exchangeCodeForTokens(HOST, CODE, CLIENT_ID, REDIRECT_URI),
    ).rejects.toThrow(/status 400/);
  });

  test("malformed JSON throws", async () => {
    mockFetchResponse({ ok: true, invalidJson: true });
    await expect(
      exchangeCodeForTokens(HOST, CODE, CLIENT_ID, REDIRECT_URI),
    ).rejects.toThrow(/invalid JSON/);
  });

  test("response missing access_token throws", async () => {
    mockFetchResponse({ ok: true, json: { refresh_token: "r", dc: "www" } });
    await expect(
      exchangeCodeForTokens(HOST, CODE, CLIENT_ID, REDIRECT_URI),
    ).rejects.toThrow(/missing access_token/);
  });
});

describe("refreshAccessToken", () => {
  test("happy path returns new tokens", async () => {
    mockFetchResponse({
      ok: true,
      json: {
        access_token: "new-access",
        refresh_token: "new-refresh",
        token_type: "bearer",
        dc: "www",
      },
    });
    const result = await refreshAccessToken(HOST, REFRESH, CLIENT_ID);
    expect(result.access_token).toBe("new-access");
  });

  test("401 throws with status", async () => {
    mockFetchResponse({ ok: false, status: 401, json: {} });
    await expect(refreshAccessToken(HOST, REFRESH, CLIENT_ID)).rejects.toThrow(
      /status 401/,
    );
  });

  test('network error throws with "network error" prefix', async () => {
    mockFetchResponse({ ok: false, rejects: new Error("timeout") });
    await expect(refreshAccessToken(HOST, REFRESH, CLIENT_ID)).rejects.toThrow(
      /network error/,
    );
  });
});
