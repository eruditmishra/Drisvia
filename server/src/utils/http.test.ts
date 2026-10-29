import { describe, it, expect } from "vitest";
import { assertAllowedUrl, ALLOW } from "./http";

describe("Outbound HTTP and SSRF Protection (assertAllowedUrl)", () => {
  describe("Protocol and Credential Enforcements", () => {
    it("allows valid HTTPS URLs", () => {
      expect(() =>
        assertAllowedUrl("https://api.github.com/user", ALLOW.github),
      ).not.toThrow();
    });

    it("rejects plain HTTP URLs unconditionally (HTTPS-only policy)", () => {
      expect(() =>
        assertAllowedUrl("http://api.github.com/user", ALLOW.github),
      ).toThrow(/Only HTTPS outbound URLs are allowed/);
    });

    it("rejects non-HTTP protocols (ftp, file, gopher, ldap)", () => {
      expect(() =>
        assertAllowedUrl("ftp://api.github.com/file", ALLOW.github),
      ).toThrow(/Only HTTPS outbound URLs are allowed/);
      expect(() =>
        assertAllowedUrl("file:///etc/passwd", ALLOW.github),
      ).toThrow(/Only HTTPS outbound URLs are allowed/);
    });

    it("rejects URLs containing embedded username or password credentials", () => {
      expect(() =>
        assertAllowedUrl(
          "https://admin:secret@api.github.com/user",
          ALLOW.github,
        ),
      ).toThrow(/Credentials in outbound URLs are not allowed/);
    });

    it("throws on malformed URL string", () => {
      expect(() => assertAllowedUrl("not-a-valid-url")).toThrow(
        /Invalid outbound URL/,
      );
    });
  });

  describe("SSRF and Private Host Blocking", () => {
    const ssrfTargets = [
      "https://localhost:8443",
      "https://127.0.0.1:8443",
      "https://10.0.0.1/admin",
      "https://192.168.1.50",
      "https://169.254.169.254/latest/meta-data/", // AWS/Azure Instance Metadata Service
      "https://0.0.0.0",
      "https://[::1]",
    ];

    it.each(ssrfTargets)(
      "blocks internal/loopback host %s by default (allowPrivate: false)",
      (target) => {
        expect(() =>
          assertAllowedUrl(target, { allowHosts: ["localhost", "127.0.0.1"] }),
        ).toThrow(/Blocked outbound host/);
      },
    );

    it("allows private hosts when explicitly permitted (allowPrivate: true)", () => {
      // e.g. for self-hosted Kubernetes or Jenkins internal cluster addresses
      expect(() =>
        assertAllowedUrl("https://10.0.0.5:6443/api/v1", {
          allowPrivate: true,
        }),
      ).not.toThrow();
    });
  });

  describe("Host Allowlists and Domain Suffix Matching", () => {
    it("allows hosts in the explicit allowHosts array (case-insensitive)", () => {
      const policy = { allowHosts: ["LOGIN.MICROSOFTONLINE.COM"] };
      expect(() =>
        assertAllowedUrl("https://login.microsoftonline.com/oauth", policy),
      ).not.toThrow();
    });

    it("allows subdomains matching allowHostSuffixes", () => {
      const policy = { allowHostSuffixes: [".openai.azure.com"] };
      expect(() =>
        assertAllowedUrl(
          "https://my-tenant-eastus.openai.azure.com/openai/deployments",
          policy,
        ),
      ).not.toThrow();
    });

    it("rejects unauthorized hosts not listed in allowHosts or allowHostSuffixes", () => {
      const policy = {
        allowHosts: ["api.github.com"],
        allowHostSuffixes: [".github.com"],
      };
      expect(() =>
        assertAllowedUrl("https://evil-attacker-site.com/steal", policy),
      ).toThrow(/Outbound host not in allowlist/);
    });

    it("rejects domain spoofing via prefix tricks", () => {
      const policy = { allowHostSuffixes: [".dynamics.com"] };
      // Attacker trying to spoof domain suffix: dynamics.com.attacker.com
      expect(() =>
        assertAllowedUrl("https://dynamics.com.attacker.com/data", policy),
      ).toThrow(/Outbound host not in allowlist/);
    });
  });

  describe("Pre-configured Service Policies (ALLOW)", () => {
    it("ALLOW.microsoftLogin permits Azure AD OAuth endpoints", () => {
      expect(() =>
        assertAllowedUrl(
          "https://login.microsoftonline.com/common/oauth2/v2.0/token",
          ALLOW.microsoftLogin,
        ),
      ).not.toThrow();
    });

    it("ALLOW.azureArm permits Azure Resource Manager", () => {
      expect(() =>
        assertAllowedUrl(
          "https://management.azure.com/subscriptions/sub-1/resourceGroups",
          ALLOW.azureArm,
        ),
      ).not.toThrow();
    });

    it("ALLOW.aws permits AWS regional and global endpoints", () => {
      expect(() =>
        assertAllowedUrl(
          "https://bedrock-agent.us-east-1.amazonaws.com",
          ALLOW.aws,
        ),
      ).not.toThrow();
    });

    it("ALLOW.dataverse permits Power Platform / CRM Dynamics endpoints", () => {
      expect(() =>
        assertAllowedUrl(
          "https://org123.crm.dynamics.com/api/data/v9.2/bots",
          ALLOW.dataverse,
        ),
      ).not.toThrow();
    });
  });
});
