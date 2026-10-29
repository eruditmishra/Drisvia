import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hashToken } from "./auth.repo";
import { generateSecret, generateURI, generate, verify } from "otplib";
import { encryptSecrets, decryptSecrets } from "../../lib/encryption";

describe("Auth and MFA Utilities", () => {
  const originalEnvKey = process.env.DISCOVERY_ENCRYPTION_KEY;
  const testKey =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    process.env.DISCOVERY_ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.DISCOVERY_ENCRYPTION_KEY = originalEnvKey;
  });

  describe("hashToken", () => {
    it("returns a 64-character hexadecimal SHA-256 hash", () => {
      const hash = hashToken("sample_refresh_token_xyz");
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it("generates deterministic hashes for the same token", () => {
      const token = "secure-random-token-123456";
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it("generates different hashes for different tokens", () => {
      expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
    });

    it("hashes empty string to standard SHA-256 empty digest", () => {
      expect(hashToken("")).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
    });
  });

  describe("MFA TOTP Secret Management and Verification", () => {
    it("generates valid base32 TOTP secret and otpauth URI", () => {
      const secret = generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThanOrEqual(16);

      const uri = generateURI({
        issuer: "Drisvia",
        label: "admin@drisvia.com",
        secret,
      });

      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain("issuer=Drisvia");
      expect(uri).toContain("secret=" + secret);
    });

    it("secures MFA secret using AES-256-GCM encryption round-trip", () => {
      const secret = generateSecret();
      const encrypted = encryptSecrets({ secret });

      expect(encrypted).not.toContain(secret);

      const decrypted = decryptSecrets(encrypted);
      expect(decrypted.secret).toBe(secret);
    });

    it("verifies valid TOTP tokens generated with the matching secret", async () => {
      const secret = generateSecret();
      const token = await generate({ secret });

      const result = await verify({
        secret,
        token,
        epochTolerance: [30, 30],
      });

      expect(result.valid).toBe(true);
    });

    it("rejects invalid TOTP tokens", async () => {
      const secret = generateSecret();
      const invalidToken = "000000";

      let valid = false;
      try {
        const result = await verify({
          secret,
          token: invalidToken,
          epochTolerance: [30, 30],
        });
        valid = result.valid;
      } catch {
        valid = false;
      }

      if (valid) {
        const badToken = "invalid";
        try {
          const res = await verify({ secret, token: badToken });
          valid = res.valid;
        } catch {
          valid = false;
        }
      }

      expect(valid).toBe(false);
    });
  });
});
