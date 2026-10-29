import { describe, it, expect } from "vitest";
import {
  getFrameworkMeta,
  getFramework,
  runAllFrameworks,
  FRAMEWORKS,
} from "./framework.registry";
import {
  makeControlAssessment,
  notApplicableGovernanceControl,
} from "./control.helpers";
import { normalizeSecurityDomains } from "../evidence.normalizer";

describe("Compliance Frameworks Registry and Rule Engines", () => {
  describe("Framework Registry Metadata", () => {
    it("registers OWASP AI Agents 2026, NIST AI RMF, and ISO/IEC 42001", () => {
      const metas = getFrameworkMeta();
      expect(metas.length).toBe(3);

      const ids = metas.map((m) => m.id);
      expect(ids).toContain("owasp_ai_agents_2026");
      expect(ids).toContain("nist_ai_rmf");
      expect(ids).toContain("iso_42001");
    });

    it("returns correct definition for getFramework", () => {
      const owasp = getFramework("owasp_ai_agents_2026");
      expect(owasp).toBeDefined();
      expect(owasp?.meta.name).toBe("OWASP AI Agents Top 10");
      expect(owasp?.meta.controlCount).toBe(10);
      expect(typeof owasp?.run).toBe("function");

      const nist = getFramework("nist_ai_rmf");
      expect(nist).toBeDefined();
      expect(nist?.meta.name).toBe("NIST AI RMF");
      expect(typeof nist?.run).toBe("function");

      const iso = getFramework("iso_42001");
      expect(iso).toBeDefined();
      expect(iso?.meta.name).toBe("ISO/IEC 42001");
      expect(typeof iso?.run).toBe("function");
    });

    it("returns undefined for unknown framework id", () => {
      expect(getFramework("unknown_framework")).toBeUndefined();
    });
  });

  describe("Control Helpers", () => {
    it("creates a properly structured ControlAssessment object with makeControlAssessment", () => {
      const assessment = makeControlAssessment(
        "owasp_ai_agents_2026",
        "AAI01",
        "Authorization Hijack",
        "Security",
        "detected",
        {
          confidence_reason: ["Tool holds wildcard admin permissions"],
          evidence: [
            {
              fact: "IAM role contains AdministratorAccess",
              source: "aws_iam",
              collection_method: "api",
              collected_at: "2026-01-01T00:00:00Z",
            },
          ],
          limitations: ["Runtime API execution not simulated"],
          related_tools: ["admin_exec_tool"],
        },
      );

      expect(assessment.framework_id).toBe("owasp_ai_agents_2026");
      expect(assessment.control_id).toBe("AAI01");
      expect(assessment.id).toBe("AAI01");
      expect(assessment.status).toBe("detected");
      expect(assessment.confidence_reason).toContain(
        "Tool holds wildcard admin permissions",
      );
      expect(assessment.evidence.length).toBe(1);
      expect(assessment.related_tools).toEqual(["admin_exec_tool"]);
      expect(assessment.last_assessed).toBeDefined();
    });

    it("creates not_applicable assessment for governance/documentation controls", () => {
      const assessment = notApplicableGovernanceControl(
        "iso_42001",
        "A.2.1",
        "AI Policy Documentation",
        "Governance",
      );

      expect(assessment.framework_id).toBe("iso_42001");
      expect(assessment.control_id).toBe("A.2.1");
      expect(assessment.status).toBe("not_applicable");
      expect(assessment.evidence_confidence).toBe(0.9);
      expect(assessment.confidence_reason[0]).toContain(
        "organizational/process/documentation control",
      );
    });
  });

  describe("runAllFrameworks Evaluation", () => {
    it("runs all 3 frameworks against normalized domains and returns assessments for every control", () => {
      const rawAgent = {
        name: "Enterprise Financial Agent",
        owner: "finance-team@corp.com",
        internet_access: true,
        metadata: {
          deepScan: true,
          hasInstructions: true,
          deep: {
            instructions: {
              present: true,
              contains_safety_rules: true,
              contains_tool_guidance: true,
            },
          },
          adversarialTools: [
            {
              name: "query_db",
              risk_flags: { can_modify_state: false, can_access_pii: true },
            },
          ],
        },
      };

      const { domains } = normalizeSecurityDomains(rawAgent);
      const results = runAllFrameworks(domains);

      expect(results).toHaveProperty("owasp_ai_agents_2026");
      expect(results).toHaveProperty("nist_ai_rmf");
      expect(results).toHaveProperty("iso_42001");

      // Verify OWASP controls
      const owaspControls = results.owasp_ai_agents_2026.controls;
      expect(Object.keys(owaspControls).length).toBe(10);
      expect(owaspControls["AAI01"]).toBeDefined();
      expect(owaspControls["AAI02"]).toBeDefined();
      expect(owaspControls["AAI03"]).toBeDefined();
      expect(owaspControls["AAI10"]).toBeDefined();

      // Verify NIST controls
      const nistControls = results.nist_ai_rmf.controls;
      expect(Object.keys(nistControls).length).toBeGreaterThan(0);

      // Verify ISO controls
      const isoControls = results.iso_42001.controls;
      expect(Object.keys(isoControls).length).toBeGreaterThan(0);
    });

    it("evaluates OWASP controls with appropriate statuses for a hardened agent", () => {
      const hardenedAgent = {
        name: "Hardened Read-Only Agent",
        owner: "sec-ops@drisvia.com",
        internet_access: false,
        metadata: {
          hasInstructions: true,
          deepScan: true,
          deep: {
            instructions: {
              present: true,
              contains_safety_rules: true,
              contains_tool_guidance: true,
            },
          },
          adversarialTools: [
            {
              name: "view_summary",
              risk_flags: {
                can_execute_code: false,
                can_modify_state: false,
                can_access_pii: false,
                can_access_phi: false,
              },
            },
          ],
        },
      };

      const { domains } = normalizeSecurityDomains(hardenedAgent);
      const results = runAllFrameworks(domains);
      const owasp = results.owasp_ai_agents_2026.controls;

      // In a hardened agent without code exec or state modification,
      // AAI03 (Excessive Agency) should not be 'detected'
      expect(owasp["AAI03"].status).not.toBe("detected");
    });
  });
});
