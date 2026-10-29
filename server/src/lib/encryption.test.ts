import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  assertEncryptionKey,
  encryptSecrets,
  decryptSecrets,
} from "./encryption";

describe("Encryption Module (AES-256-GCM)", () => {
  const originalEnvKey = process.env.DISCOVERY_ENCRYPTION_KEY;
  // Valid 64-character hex key (32 bytes)
  const validKey =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const alternativeKey =
    "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

  beforeEach(() => {
    process.env.DISCOVERY_ENCRYPTION_KEY = validKey;
  });

  afterEach(() => {
    process.env.DISCOVERY_ENCRYPTION_KEY = originalEnvKey;
  });

  describe("assertEncryptionKey", () => {
    it("passes when DISCOVERY_ENCRYPTION_KEY is a valid 64-char hex string", () => {
      expect(() => assertEncryptionKey()).not.toThrow();
    });

    it("throws when DISCOVERY_ENCRYPTION_KEY is missing", () => {
      delete process.env.DISCOVERY_ENCRYPTION_KEY;
      expect(() => assertEncryptionKey()).toThrow(
        /DISCOVERY_ENCRYPTION_KEY is required/,
      );
    });

    it("throws when DISCOVERY_ENCRYPTION_KEY is empty", () => {
      process.env.DISCOVERY_ENCRYPTION_KEY = "";
      expect(() => assertEncryptionKey()).toThrow(
        /DISCOVERY_ENCRYPTION_KEY is required/,
      );
    });

    it("throws when DISCOVERY_ENCRYPTION_KEY is too short (32 hex chars instead of 64)", () => {
      process.env.DISCOVERY_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
      expect(() => assertEncryptionKey()).toThrow(
        /must be a 64-character hexadecimal string/,
      );
    });

    it("throws when DISCOVERY_ENCRYPTION_KEY is too long (65 hex chars)", () => {
      process.env.DISCOVERY_ENCRYPTION_KEY = validKey + "a";
      expect(() => assertEncryptionKey()).toThrow(
        /must be a 64-character hexadecimal string/,
      );
    });

    it("throws when DISCOVERY_ENCRYPTION_KEY contains non-hex characters", () => {
      // Contains 'z'
      process.env.DISCOVERY_ENCRYPTION_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdez";
      expect(() => assertEncryptionKey()).toThrow(
        /must be a 64-character hexadecimal string/,
      );
    });
  });

  describe("encryptSecrets and decryptSecrets", () => {
    it("successfully encrypts and decrypts a standard secrets object", () => {
      const secrets = {
        apiKey: "sk-proj-1234567890abcdef",
        tenantId: "tenant-uuid-456",
        port: 5432,
        enabled: true,
      };

      const encrypted = encryptSecrets(secrets);
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toContain("sk-proj-1234567890abcdef");

      const decrypted = decryptSecrets(encrypted);
      expect(decrypted).toEqual(secrets);
    });

    it("formats the ciphertext as three colon-separated base64 strings (iv:authTag:ciphertext)", () => {
      const secrets = { token: "secret-token" };
      const encrypted = encryptSecrets(secrets);
      const parts = encrypted.split(":");

      expect(parts.length).toBe(3);
      const [ivB64, authTagB64, ciphertextB64] = parts;

      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const ciphertext = Buffer.from(ciphertextB64, "base64");

      // 12 bytes IV (96-bit for AES-GCM)
      expect(iv.length).toBe(12);
      // 16 bytes Auth Tag (128-bit)
      expect(authTag.length).toBe(16);
      expect(ciphertext.length).toBeGreaterThan(0);
    });

    it("generates a unique IV for each encryption call (probabilistic encryption)", () => {
      const secrets = { key: "same-key-value" };
      const enc1 = encryptSecrets(secrets);
      const enc2 = encryptSecrets(secrets);

      expect(enc1).not.toBe(enc2);
      const iv1 = enc1.split(":")[0];
      const iv2 = enc2.split(":")[0];
      expect(iv1).not.toBe(iv2);

      expect(decryptSecrets(enc1)).toEqual(secrets);
      expect(decryptSecrets(enc2)).toEqual(secrets);
    });

    it("handles nested objects, arrays, and null values", () => {
      const complex = {
        auth: {
          clientCert: "-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----",
          scopes: ["read:agents", "write:agents", "audit:export"],
        },
        metadata: {
          attemptCount: 3,
          lastActive: null,
          flags: [true, false, true],
        },
      };

      const encrypted = encryptSecrets(complex);
      const decrypted = decryptSecrets(encrypted);
      expect(decrypted).toEqual(complex);
    });

    it("handles empty objects correctly", () => {
      const empty = {};
      const encrypted = encryptSecrets(empty);
      const decrypted = decryptSecrets(encrypted);
      expect(decrypted).toEqual(empty);
    });

    it("handles Unicode characters, emojis, and non-ASCII strings", () => {
      const unicodePayload = {
        agentName: "Agent-🤖-日本語-العربية",
        greeting: "Bonjour le monde! 🌍✨",
      };

      const encrypted = encryptSecrets(unicodePayload);
      const decrypted = decryptSecrets(encrypted);
      expect(decrypted).toEqual(unicodePayload);
    });

    it("throws when ciphertext is malformed (not 3 parts)", () => {
      expect(() => decryptSecrets("invalid-cipher-format")).toThrow(
        /Malformed encrypted secrets — expected iv:authTag:ciphertext/,
      );
      expect(() => decryptSecrets("part1:part2")).toThrow(
        /Malformed encrypted secrets — expected iv:authTag:ciphertext/,
      );
      expect(() => decryptSecrets("part1:part2:part3:part4")).toThrow(
        /Malformed encrypted secrets — expected iv:authTag:ciphertext/,
      );
    });

    it("throws error when ciphertext has been tampered with (GCM authentication check)", () => {
      const secrets = { password: "super-secret-password" };
      const encrypted = encryptSecrets(secrets);
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Flip the last character of the ciphertext
      const tamperedCiphertext =
        ciphertext.slice(0, -1) + (ciphertext.slice(-1) === "A" ? "B" : "A");
      const tampered = [iv, authTag, tamperedCiphertext].join(":");

      expect(() => decryptSecrets(tampered)).toThrow();
    });

    it("throws error when authTag has been tampered with", () => {
      const secrets = { password: "super-secret-password" };
      const encrypted = encryptSecrets(secrets);
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Tamper with the authTag (modify first char to ensure decoded bytes change)
      const tamperedAuthTag =
        (authTag[0] === "A" ? "B" : "A") + authTag.slice(1);
      const tampered = [iv, tamperedAuthTag, ciphertext].join(":");

      expect(() => decryptSecrets(tampered)).toThrow();
    });

    it("throws error when IV has been tampered with", () => {
      const secrets = { password: "super-secret-password" };
      const encrypted = encryptSecrets(secrets);
      const [iv, authTag, ciphertext] = encrypted.split(":");

      // Tamper with IV
      const tamperedIv = iv.slice(0, -1) + (iv.slice(-1) === "Z" ? "W" : "Z");
      const tampered = [tamperedIv, authTag, ciphertext].join(":");

      expect(() => decryptSecrets(tampered)).toThrow();
    });

    it("throws error when decrypted with a different encryption key", () => {
      const secrets = { secretToken: "12345" };
      const encrypted = encryptSecrets(secrets);

      // Change key in environment
      process.env.DISCOVERY_ENCRYPTION_KEY = alternativeKey;

      expect(() => decryptSecrets(encrypted)).toThrow();
    });
  });
});
