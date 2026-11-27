import { fetchUserInfo } from "../../../lib/oauth/userInfo";

const HOST = "https://www.questionpro.com";
const TOKEN = "access-token";

function mockFetchResponse(init: {
  ok: boolean;
  status?: number;
  json?: unknown;
  rejects?: Error;
}): void {
  if (init.rejects) {
    global.fetch = jest.fn().mockRejectedValue(init.rejects) as never;
    return;
  }
  global.fetch = jest.fn().mockResolvedValue({
    ok: init.ok,
    status: init.status ?? 200,
    json: jest.fn().mockResolvedValue(init.json),
  }) as never;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("fetchUserInfo", () => {
  test("happy path returns parsed user info", async () => {
    mockFetchResponse({
      ok: true,
      json: {
        userID: 12345,
        emailAddress: "alice@example.com",
        firstName: "Alice",
        lastName: "Doe",
        orgID: 999,
      },
    });
    const result = await fetchUserInfo(HOST, TOKEN);
    expect(result.userID).toBe(12345);
    expect(result.emailAddress).toBe("alice@example.com");
  });

  test("network error throws", async () => {
    mockFetchResponse({ ok: false, rejects: new Error("ECONNRESET") });
    await expect(fetchUserInfo(HOST, TOKEN)).rejects.toThrow(/network error/);
  });

  test("401 (expired token) throws with status", async () => {
    mockFetchResponse({ ok: false, status: 401, json: {} });
    await expect(fetchUserInfo(HOST, TOKEN)).rejects.toThrow(/status 401/);
  });

  test("response missing userID throws", async () => {
    mockFetchResponse({ ok: true, json: { emailAddress: "x@y.com" } });
    await expect(fetchUserInfo(HOST, TOKEN)).rejects.toThrow(
      /missing required/,
    );
  });

  test("response missing emailAddress throws", async () => {
    mockFetchResponse({ ok: true, json: { userID: 1 } });
    await expect(fetchUserInfo(HOST, TOKEN)).rejects.toThrow(
      /missing required/,
    );
  });
});
