import { describe, it, expect } from "vitest";
import {
  GIT_VALIDATORS,
  GIT_DISCOVERERS,
  discoverGitSourceConnector,
} from "./git.scanner";

describe("Git Source Discovery Scanner", () => {
  it("registers validators and discoverers for github and gitlab", () => {
    expect(GIT_VALIDATORS.github).toBeDefined();
    expect(GIT_VALIDATORS.gitlab).toBeDefined();
    expect(GIT_DISCOVERERS.github).toBeDefined();
    expect(GIT_DISCOVERERS.gitlab).toBeDefined();
  });

  it("throws when discoverGitSourceConnector is called with an unsupported provider", async () => {
    await expect(
      discoverGitSourceConnector({ provider: "bitbucket" } as any),
    ).rejects.toThrow(/No Git discoverer for provider bitbucket/);
  });

  it("validateGithub throws if secrets.token is missing", async () => {
    await expect(
      GIT_VALIDATORS.github({ config: {}, secrets: {} } as any),
    ).rejects.toThrow(/GitHub token is required/);
  });

  it("validateGitlab throws if secrets.token is missing", async () => {
    await expect(
      GIT_VALIDATORS.gitlab({ config: {}, secrets: {} } as any),
    ).rejects.toThrow(/GitLab token is required/);
  });
});
