import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import {
  STATE_CIPHER_ALGORITHM,
  STATE_ENCRYPTION_KEY_BYTES,
  STATE_IV_LENGTH_BYTES,
} from "./constants";
import type { IStatePayload } from "./types";

const KEY_LENGTH_ERROR = `QUESTIONPRO_OAUTH_ENCRYPTION_KEY must be ${STATE_ENCRYPTION_KEY_BYTES} bytes`;

function keyBuffer(encryptionKey: string): Buffer {
  const buf = Buffer.from(encryptionKey, "utf-8");
  if (buf.length !== STATE_ENCRYPTION_KEY_BYTES) {
    throw new Error(KEY_LENGTH_ERROR);
  }
  return buf;
}

export function encryptState(
  payload: IStatePayload,
  encryptionKey: string,
): string {
  const iv = randomBytes(STATE_IV_LENGTH_BYTES);
  const cipher = createCipheriv(
    STATE_CIPHER_ALGORITHM,
    keyBuffer(encryptionKey),
    iv,
  );
  const plaintext = Buffer.from(JSON.stringify(payload), "utf-8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    encrypted.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

export function decryptState(
  cipherText: string,
  encryptionKey: string,
): IStatePayload {
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid state ciphertext");
  }
  const [ivB64, encryptedB64, authTagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = createDecipheriv(
    STATE_CIPHER_ALGORITHM,
    keyBuffer(encryptionKey),
    iv,
  );
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf-8")) as IStatePayload;
}
