import { describe, it, expect, vi, beforeEach } from "vitest";
import { config } from "./config";

describe("CORS Policy and Allowed Origins", () => {
  it("whitelists https://drisvia.apnto.com by default in corsOrigins", () => {
    expect(config.corsOrigins).toContain("https://drisvia.apnto.com");
  });

  it("normalizes origins by stripping trailing slashes", () => {
    const rawOrigins = [
      "https://drisvia.apnto.com/",
      "http://localhost:5173///",
      "https://another-domain.com",
    ];
    const normalized = Array.from(
      new Set(rawOrigins.map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean)),
    );
    expect(normalized).toEqual([
      "https://drisvia.apnto.com",
      "http://localhost:5173",
      "https://another-domain.com",
    ]);
  });

  it("matches incoming Origin header correctly against whitelist", () => {
    const isOriginAllowed = (origin: string | undefined): boolean => {
      if (!origin) return true; // server-to-server / curl
      const normalized = origin.trim().replace(/\/+$/, "");
      return config.corsOrigins.includes(normalized);
    };

    // Whitelisted production domain
    expect(isOriginAllowed("https://drisvia.apnto.com")).toBe(true);
    expect(isOriginAllowed("https://drisvia.apnto.com/")).toBe(true);

    // Requests with no origin (curl, Postman, cron)
    expect(isOriginAllowed(undefined)).toBe(true);

    // Unwhitelisted domain
    expect(isOriginAllowed("https://malicious-site.com")).toBe(false);
    expect(isOriginAllowed("https://fake-drisvia.com")).toBe(false);
  });
});
