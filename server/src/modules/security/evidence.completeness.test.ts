import { describe, it, expect } from "vitest";
import { computeEvidenceCompleteness } from "./evidence.completeness";
import { normalizeSecurityDomains } from "./evidence.normalizer";

describe("Evidence Completeness Engine", () => {
  it("computes completeness from normalized domains of an agent with observed data", () => {
    const rawAgent = {
      name: "Customer Support Agent",
      framework: "BedrockAgent",
      internet_access: true,
      owner: "support-team@drisvia.com",
      metadata: {
        agentStatus: "confirmed",
        awsType: "BedrockAgent",
        agentId: "agent-12345",
        deep: {
          instructionPreview: "You are a customer service assistant. You must not disclose user PII.",
          role: "arn:aws:iam::123456789012:role/BedrockAgentRole",
        },
      },
    };

    const { domains } = normalizeSecurityDomains(rawAgent);
    const completeness = computeEvidenceCompleteness(domains);

    expect(completeness).toBeDefined();
    expect(completeness.overall).toBeGreaterThan(0);
    expect(completeness.overall).toBeLessThanOrEqual(1.0);
    expect(completeness.identity).toBeGreaterThanOrEqual(0);
    expect(completeness.model).toBeGreaterThanOrEqual(0);
    expect(completeness.instructions).toBeGreaterThanOrEqual(0);
  });

  it("returns low completeness when agent metadata is completely empty", () => {
    const rawAgent = {};
    const { domains } = normalizeSecurityDomains(rawAgent);
    const completeness = computeEvidenceCompleteness(domains);

    // Empty agent should have low overall completeness
    expect(completeness.overall).toBeLessThan(0.4);
  });

  it("handles placeholder model by giving partial 0.25 completeness", () => {
    const rawAgent = {
      name: "Copilot Studio Placeholder Agent",
      model: "copilot-studio-agent",
      metadata: {},
    };
    const { domains } = normalizeSecurityDomains(rawAgent);
    expect(domains.model.is_identity_placeholder).toBe(true);

    const completeness = computeEvidenceCompleteness(domains);
    expect(completeness.model).toBe(0.25);
  });

  it("assigns higher completeness when instructions are observed and have safety rules", () => {
    const agentWithoutInstructions = {
      name: "Agent No Instructions",
      metadata: {},
    };
    const agentWithInstructions = {
      name: "Agent With Instructions",
      metadata: {
        hasInstructions: true,
        deep: {
          instructions: {
            present: true,
            hash: "a1b2c3d4e5f60718",
            length: 120,
            contains_safety_rules: true,
            contains_tool_guidance: true,
          },
        },
      },
    };

    const c1 = computeEvidenceCompleteness(
      normalizeSecurityDomains(agentWithoutInstructions).domains,
    );
    const c2 = computeEvidenceCompleteness(
      normalizeSecurityDomains(agentWithInstructions).domains,
    );

    expect(c2.instructions).toBeGreaterThan(c1.instructions);
    expect(c2.instructions).toBeGreaterThan(0.5);
  });

  it("reflects tools completeness when tools are enumerated", () => {
    const agentWithTools = {
      name: "Agent With Tools",
      metadata: {
        adversarialTools: [
          {
            name: "fetch_customer_record",
            description: "Fetches user CRM record",
            risk_flags: { can_access_pii: true },
          },
        ],
      },
    };

    const { domains } = normalizeSecurityDomains(agentWithTools);
    const completeness = computeEvidenceCompleteness(domains);

    expect(completeness.tools).toBeGreaterThan(0);
  });

  it("includes all 13 domain scores in the output payload", () => {
    const { domains } = normalizeSecurityDomains({ name: "Full Test Agent" });
    const result = computeEvidenceCompleteness(domains);

    const expectedKeys = [
      "overall",
      "identity",
      "model",
      "instructions",
      "tools",
      "permissions",
      "data_access",
      "network",
      "memory",
      "guardrails",
      "human_oversight",
      "inter_agent",
      "supply_chain",
      "runtime",
    ];

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
      expect(typeof (result as any)[key]).toBe("number");
      expect((result as any)[key]).toBeGreaterThanOrEqual(0);
      expect((result as any)[key]).toBeLessThanOrEqual(1.0);
    }
  });
});
