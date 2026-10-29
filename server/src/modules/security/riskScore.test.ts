import { describe, it, expect } from "vitest";
import { calculateAgentRiskScore } from "./riskScore";

describe("Risk Score Engine", () => {
  // Baseline agent with owner to isolate specific factor testing
  const baseAgent = { owner: "team-security" };

  describe("Component A: Intrinsic Attack Surface (max 45)", () => {
    it("adds +15 points for PII access", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          data_access: { has_pii: true, has_phi: false },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.intrinsicAttackSurface.score).toBe(15);
      const factor = result.components.intrinsicAttackSurface.factors.find(
        (f) => f.name.includes("PII/PHI"),
      );
      expect(factor?.applied).toBe(true);
      expect(factor?.points).toBe(15);
    });

    it("adds +15 points for PHI access", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          data_access: { has_pii: false, has_phi: true },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.intrinsicAttackSurface.score).toBe(15);
      const factor = result.components.intrinsicAttackSurface.factors.find(
        (f) => f.name.includes("PII/PHI"),
      );
      expect(factor?.applied).toBe(true);
    });

    it("adds +10 points for Internet/egress access via top-level agent property or domains", () => {
      // 1. Top-level agent property
      const res1 = calculateAgentRiskScore(
        { ...baseAgent, internet_access: true },
        { evidence_completeness: { overall: 1.0 } },
      );
      expect(res1.components.intrinsicAttackSurface.score).toBe(10);

      // 2. Domain network internet_access value
      const res2 = calculateAgentRiskScore(
        { ...baseAgent, internet_access: false },
        {
          evidence_completeness: { overall: 1.0 },
          domains: { network: { internet_access: { value: true } } },
        },
      );
      expect(res2.components.intrinsicAttackSurface.score).toBe(10);

      // 3. Domain network unrestricted_egress
      const res3 = calculateAgentRiskScore(
        baseAgent,
        {
          evidence_completeness: { overall: 1.0 },
          domains: { network: { unrestricted_egress: true } },
        },
      );
      expect(res3.components.intrinsicAttackSurface.score).toBe(10);
    });

    it("adds +10 points for state-modifying or code-executing tools", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          tools: {
            items: [
              { name: "read_file", risk_flags: { can_modify_state: false } },
              { name: "exec_bash", risk_flags: { can_execute_code: true } },
            ],
          },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.intrinsicAttackSurface.score).toBe(10);
      const factor = result.components.intrinsicAttackSurface.factors.find(
        (f) => f.name.includes("State-modifying or code-executing"),
      );
      expect(factor?.applied).toBe(true);
    });

    it("adds +5 points for fully autonomous execution (no human-in-the-loop)", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          human_oversight: { can_execute_without_user: true },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.intrinsicAttackSurface.score).toBe(5);
      const factor = result.components.intrinsicAttackSurface.factors.find(
        (f) => f.name.includes("Fully autonomous"),
      );
      expect(factor?.applied).toBe(true);
    });

    it("adds +5 points for data write or delete capability", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          human_oversight: { can_delete_data: true },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.intrinsicAttackSurface.score).toBe(5);
    });

    it("adds points for multi-agent orchestration and MCP server connections (capped at 5)", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          inter_agent: {
            connected_agents: ["agent-1", "agent-2"],
            mcp_servers: ["mcp-server-1"],
          },
        },
      };
      // (2 agents + 1 server) * 2 = 6, capped at 5
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.intrinsicAttackSurface.score).toBe(5);
    });

    it("caps Component A at max 45 even when all risk factors are triggered", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          data_access: { has_pii: true }, // +15
          network: { unrestricted_egress: true }, // +10
          tools: {
            items: [{ risk_flags: { can_modify_state: true } }], // +10
          },
          human_oversight: {
            can_execute_without_user: true, // +5
            can_modify_data: true, // +5
          },
          inter_agent: {
            connected_agents: ["agent-a"], // +2
            mcp_servers: ["mcp-b"], // +2 -> sum is 4
          },
        },
      };
      // Sum without cap = 15 + 10 + 10 + 5 + 5 + 4 = 49
      const result = calculateAgentRiskScore(
        { ...baseAgent, internet_access: true },
        assessment,
      );
      expect(result.components.intrinsicAttackSurface.score).toBe(45);
    });
  });

  describe("Component B: Governance Deficits (max 30)", () => {
    it("adds +15 points for Shadow AI status", () => {
      const result = calculateAgentRiskScore(
        { ...baseAgent, status: "shadow" },
        { evidence_completeness: { overall: 1.0 } },
      );
      expect(result.components.governanceDeficits.score).toBe(15);
      const factor = result.components.governanceDeficits.factors.find(
        (f) => f.name.includes("Shadow AI"),
      );
      expect(factor?.applied).toBe(true);
    });

    it("adds +5 points when foundational guardrails are confirmed absent", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          guardrails: { present: false },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.governanceDeficits.score).toBe(5);
    });

    it("adds +2 partial risk points when guardrails were attempted but status remains unknown", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          guardrails: { present: null, collection_status: "observed_partial" },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.governanceDeficits.score).toBe(2);
    });

    it("adds +5 points when state-modifying tools operate without human approval", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          tools: { items: [{ risk_flags: { can_modify_state: true } }] },
          human_oversight: { human_approval_required: { value: false } },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      // Tool modifying state (+10 in A) + missing approval (+5 in B)
      expect(result.components.governanceDeficits.score).toBe(5);
    });

    it("adds +3 points when no identifiable owner exists", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          identity: { owner: { value: null } },
        },
      };
      const result = calculateAgentRiskScore({ owner: null }, assessment);
      expect(result.components.governanceDeficits.score).toBe(3);
    });

    it("does not add points for missing owner if agent.owner or identity.owner is present", () => {
      const res1 = calculateAgentRiskScore(
        { owner: "sec-team@drisvia.com" },
        { evidence_completeness: { overall: 1.0 } },
      );
      expect(res1.components.governanceDeficits.score).toBe(0);

      const res2 = calculateAgentRiskScore(
        {},
        {
          evidence_completeness: { overall: 1.0 },
          domains: { identity: { owner: { value: "lead-dev" } } },
        },
      );
      expect(res2.components.governanceDeficits.score).toBe(0);
    });

    it("adds +2 points when audit logging is explicitly disabled", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          guardrails: { logging_enabled: false },
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.governanceDeficits.score).toBe(2);
    });

    it("caps Component B at max 30", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        domains: {
          guardrails: { present: false, logging_enabled: false }, // 5 + 2 = 7
          tools: { items: [{ risk_flags: { can_execute_code: true } }] },
          human_oversight: { human_approval_required: { value: false } }, // 5
          identity: { owner: { value: null } }, // 3
        },
      };
      // 15 (shadow) + 5 (no guardrails) + 5 (no approval) + 3 (no owner) + 2 (no logging) = 30
      const result = calculateAgentRiskScore({ status: "shadow", owner: null }, assessment);
      expect(result.components.governanceDeficits.score).toBe(30);
    });
  });

  describe("Component C: OWASP Vulnerabilities (max 40)", () => {
    it("accumulates points for detected (+15), control_gap (+5), and unknown (+2)", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        frameworks: {
          owasp_ai_agents_2026: {
            controls: {
              AAI01: { control_id: "AAI01", name: "Auth Hijack", status: "detected" }, // +15
              AAI02: { control_id: "AAI02", name: "Goal Manipulation", status: "control_gap" }, // +5
              AAI03: { control_id: "AAI03", name: "Excessive Agency", status: "unknown" }, // +2
              AAI04: { control_id: "AAI04", name: "Memory Poisoning", status: "not_observed" }, // 0
            },
          },
        },
      };

      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.owaspVulnerabilities.score).toBe(22);
    });

    it("caps Component C at max 40", () => {
      const assessment = {
        evidence_completeness: { overall: 1.0 },
        frameworks: {
          owasp_ai_agents_2026: {
            controls: {
              AAI01: { status: "detected" }, // 15
              AAI02: { status: "detected" }, // 15
              AAI03: { status: "detected" }, // 15 -> sum 45 > 40
            },
          },
        },
      };

      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.owaspVulnerabilities.score).toBe(40);
    });
  });

  describe("Component D: Evidence Completeness Multiplier", () => {
    it("applies 1.2x penalty when evidence completeness is < 0.40", () => {
      const assessment = {
        evidence_completeness: { overall: 0.25 },
        domains: {
          data_access: { has_pii: true }, // +15
          network: { unrestricted_egress: true }, // +10
        },
      };
      // raw score = 25. With 1.2x penalty: 25 * 1.2 = 30
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.unknownMultiplier.applied).toBe(true);
      expect(result.components.unknownMultiplier.reason).toContain("critically low (25%)");
      expect(result.finalScore).toBe(30);
    });

    it("does not apply multiplier when evidence completeness is >= 0.40", () => {
      const assessment = {
        evidence_completeness: { overall: 0.50 },
        domains: {
          data_access: { has_pii: true }, // +15
          network: { unrestricted_egress: true }, // +10
        },
      };
      const result = calculateAgentRiskScore(baseAgent, assessment);
      expect(result.components.unknownMultiplier.applied).toBe(false);
      expect(result.finalScore).toBe(25);
    });

    it("caps the final score at 100", () => {
      const assessment = {
        evidence_completeness: { overall: 0.1 }, // triggers 1.2x
        domains: {
          data_access: { has_pii: true }, // 15
          network: { unrestricted_egress: true }, // 10
          tools: { items: [{ risk_flags: { can_execute_code: true } }] }, // 10
          human_oversight: {
            can_execute_without_user: true, // 5
            can_modify_data: true, // 5
          },
          guardrails: { present: false, logging_enabled: false }, // 7
        },
        frameworks: {
          owasp_ai_agents_2026: {
            controls: {
              AAI01: { status: "detected" }, // 15
              AAI02: { status: "detected" }, // 15
              AAI03: { status: "detected" }, // 15 (capped at 40)
            },
          },
        },
      };
      // Component A: 45
      // Component B: 15 (shadow) + 7 = 22
      // Component C: 40
      // Sum = 107. With 1.2x = 128.4 -> capped at 100
      const result = calculateAgentRiskScore({ ...baseAgent, status: "shadow" }, assessment);
      expect(result.finalScore).toBe(100);
      expect(result.riskLevel).toBe("Critical");
    });
  });

  describe("Risk Level Classification", () => {
    it("classifies score <= 25 as Low", () => {
      const res = calculateAgentRiskScore(
        baseAgent,
        {
          evidence_completeness: { overall: 1.0 },
          domains: { network: { unrestricted_egress: true } }, // 10
        },
      );
      expect(res.finalScore).toBe(10);
      expect(res.riskLevel).toBe("Low");
    });

    it("classifies score > 25 and <= 50 as Medium", () => {
      const res = calculateAgentRiskScore(
        baseAgent,
        {
          evidence_completeness: { overall: 1.0 },
          domains: {
            data_access: { has_pii: true }, // 15
            network: { unrestricted_egress: true }, // 10
            human_oversight: { can_modify_data: true }, // 5 -> total 30
          },
        },
      );
      expect(res.finalScore).toBe(30);
      expect(res.riskLevel).toBe("Medium");
    });

    it("classifies score > 50 and <= 75 as High", () => {
      const res = calculateAgentRiskScore(
        { ...baseAgent, status: "shadow" }, // 15 in B
        {
          evidence_completeness: { overall: 1.0 },
          domains: {
            data_access: { has_pii: true }, // 15 in A
            network: { unrestricted_egress: true }, // 10 in A
            tools: { items: [{ risk_flags: { can_execute_code: true } }] }, // 10 in A
            human_oversight: { can_modify_data: true }, // 5 in A
            guardrails: { present: false }, // 5 in B
          },
        },
      );
      // A = 40, B = 20 -> total 60
      expect(res.finalScore).toBe(60);
      expect(res.riskLevel).toBe("High");
    });

    it("classifies score > 75 as Critical", () => {
      const res = calculateAgentRiskScore(
        { ...baseAgent, status: "shadow" }, // 15 in B
        {
          evidence_completeness: { overall: 1.0 },
          domains: {
            data_access: { has_pii: true }, // 15 in A
            network: { unrestricted_egress: true }, // 10 in A
            tools: { items: [{ risk_flags: { can_execute_code: true } }] }, // 10 in A
            guardrails: { present: false }, // 5 in B
          },
          frameworks: {
            owasp_ai_agents_2026: {
              controls: {
                AAI01: { status: "detected" }, // 15 in C
                AAI02: { status: "detected" }, // 15 in C
              },
            },
          },
        },
      );
      // A = 35, B = 20, C = 30 -> Total 85
      expect(res.finalScore).toBe(85);
      expect(res.riskLevel).toBe("Critical");
    });
  });

  describe("Edge Cases and Missing Data", () => {
    it("handles null or empty assessment without throwing", () => {
      // When agent and assessment are null:
      // A: 0, B: 3 (no owner), C: 0. completeness = 0 -> multiplier 1.2 applies -> 3 * 1.2 = 3.6 -> 4
      const res = calculateAgentRiskScore(null, null);
      expect(res.finalScore).toBe(4);
      expect(res.riskLevel).toBe("Low");
      expect(res.components.intrinsicAttackSurface.score).toBe(0);
      expect(res.components.governanceDeficits.score).toBe(3);
      expect(res.components.owaspVulnerabilities.score).toBe(0);
      expect(res.components.unknownMultiplier.applied).toBe(true);
    });
  });
});
