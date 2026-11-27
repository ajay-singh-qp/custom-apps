import { validateQpHost } from "../../../lib/oauth/urlValidator";

describe("validateQpHost", () => {
  test("accepts https://www.questionpro.com", () => {
    expect(validateQpHost("https://www.questionpro.com")).toBe(true);
  });

  test("accepts https://www.questionpro.eu", () => {
    expect(validateQpHost("https://www.questionpro.eu")).toBe(true);
  });

  test("rejects https://evil.com", () => {
    expect(validateQpHost("https://evil.com")).toBe(false);
  });

  test("rejects undefined", () => {
    expect(validateQpHost(undefined)).toBe(false);
  });

  test("rejects empty string", () => {
    expect(validateQpHost("")).toBe(false);
  });
});
