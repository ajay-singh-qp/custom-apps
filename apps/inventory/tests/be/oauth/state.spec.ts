import { decryptState, encryptState } from "../../../lib/oauth/state";

const VALID_KEY_32 = "a".repeat(32);
const DIFFERENT_KEY_32 = "b".repeat(32);

describe("encryptState + decryptState", () => {
  test("round-trips the payload shape", () => {
    const payload = {
      appOrigin: "https://www.questionpro.com",
      nonce: "abc123",
    };
    const cipher = encryptState(payload, VALID_KEY_32);
    expect(decryptState(cipher, VALID_KEY_32)).toEqual(payload);
  });

  test("round-trip without appOrigin", () => {
    const payload = { nonce: "nonce-only" };
    const cipher = encryptState(payload, VALID_KEY_32);
    expect(decryptState(cipher, VALID_KEY_32)).toEqual(payload);
  });

  test("decrypt with the wrong key throws", () => {
    const cipher = encryptState({ nonce: "x" }, VALID_KEY_32);
    expect(() => decryptState(cipher, DIFFERENT_KEY_32)).toThrow();
  });

  test("decrypt of tampered ciphertext throws", () => {
    const cipher = encryptState({ nonce: "x" }, VALID_KEY_32);
    const parts = cipher.split(":");
    const tamperedEncrypted = Buffer.from(parts[1], "base64");
    tamperedEncrypted[0] = tamperedEncrypted[0] ^ 0xff;
    const tampered = [
      parts[0],
      tamperedEncrypted.toString("base64"),
      parts[2],
    ].join(":");
    expect(() => decryptState(tampered, VALID_KEY_32)).toThrow();
  });

  test("decrypt of malformed ciphertext throws", () => {
    expect(() => decryptState("not-three-parts", VALID_KEY_32)).toThrow(
      "Invalid state ciphertext",
    );
  });

  test("encrypt with wrong-length key throws", () => {
    expect(() => encryptState({ nonce: "x" }, "too-short")).toThrow(/32 bytes/);
  });
});
