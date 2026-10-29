import { describe, it, expect } from "vitest";
import {
  emptyTool,
  emptyInstructions,
  emptyIdentityAndAccess,
  emptyDataAccess,
  emptyMcpServer,
  emptyMemoryAndContext,
  emptyConnectivity,
  emptyAdversarialSurface,
  hashText,
  instructionPreview,
  inferToolRiskFlags,
  toolsFromBedrockActionGroup,
  buildInstructionsFromText,
  deriveOwaspHints,
  collectRiskIndicators,
  classifyAdversarialCategory,
  buildAdversarialSurface,
  ADVERSARIAL_SCHEMA_VERSION,
} from "./adverarialInventory";

describe("Adversarial Red-Teaming Inventory Surface Engine", () => {
  describe("Default / Empty Surface Generators", () => {
    it("generates an empty tool with all P0 risk flags default to false", () => {
      const tool = emptyTool({ name: "test_tool" });
      expect(tool.name).toBe("test_tool");
      expect(tool.risk_flags.can_execute_code).toBe(false);
      expect(tool.risk_flags.can_access_pii).toBe(false);
      expect(tool.risk_flags.can_access_phi).toBe(false);
      expect(tool.risk_flags.can_modify_state).toBe(false);
      expect(tool.risk_flags.can_call_external_apis).toBe(false);
      expect(tool.risk_flags.can_access_filesystem).toBe(false);
      expect(tool.risk_flags.can_access_secrets).toBe(false);
      expect(tool.confidence).toBe("low");
    });

    it("generates empty adversarial surface with valid schema version", () => {
      const surface = emptyAdversarialSurface();
      expect(surface.schema_version).toBe(ADVERSARIAL_SCHEMA_VERSION);
      expect(surface.agent_detected).toBe(false);
      expect(surface.category).toBe("unknown");
      expect(surface.tools).toEqual([]);
      expect(surface.instructions.present).toBe(false);
      expect(surface.mcp_servers).toEqual([]);
    });
  });

  describe("hashText", () => {
    it("generates a 16-hex character sha256 prefix for input text", () => {
      const hash1 = hashText("system instructions v1");
      const hash2 = hashText("system instructions v1");
      const hash3 = hashText("different instructions");

      expect(hash1).toBeDefined();
      expect(hash1?.length).toBe(16);
      expect(/^[0-9a-f]{16}$/.test(hash1!)).toBe(true);
      expect(hash1).toBe(hash2); // deterministic
      expect(hash1).not.toBe(hash3);
    });

    it("returns null for empty, undefined, or null input", () => {
      expect(hashText(null)).toBeNull();
      expect(hashText(undefined)).toBeNull();
      expect(hashText("")).toBeNull();
    });
  });

  describe("instructionPreview", () => {
    it("normalizes whitespace and truncates at max characters with ellipsis", () => {
      const longText = "Line 1\n   Line 2\t\tLine 3 with multiple    spaces and more words";
      const preview = instructionPreview(longText, 25);
      expect(preview).toBeDefined();
      expect(preview!.length).toBeGreaterThan(25);
      expect(preview!).not.toContain("\n");
      expect(preview!).not.toContain("\t");
    });

    it("returns original text when length is within max", () => {
      const text = "Short prompt";
      expect(instructionPreview(text, 50)).toBe("Short prompt");
    });

    it("returns null for empty text", () => {
      expect(instructionPreview("")).toBeNull();
      expect(instructionPreview("   ")).toBeNull();
      expect(instructionPreview(null)).toBeNull();
    });
  });

  describe("inferToolRiskFlags", () => {
    it("identifies code execution capabilities", () => {
      const flags = inferToolRiskFlags({
        name: "execute_python_script",
        description: "Runs python interpreter in sandbox",
      });
      expect(flags.can_execute_code).toBe(true);
      expect(flags.can_access_pii).toBe(false);
    });

    it("identifies PII and PHI data access capabilities", () => {
      const flags = inferToolRiskFlags({
        name: "query_patient_records",
        description: "Retrieves customer email and medical health record under hipaa",
      });
      expect(flags.can_access_pii).toBe(true);
      expect(flags.can_access_phi).toBe(true);
    });

    it("identifies state-modifying actions", () => {
      const flags = inferToolRiskFlags({
        name: "update_customer_balance",
        description: "Mutates and writes transaction record to db",
      });
      expect(flags.can_modify_state).toBe(true);
    });

    it("identifies external web / API calls", () => {
      const flags = inferToolRiskFlags({
        name: "post_webhook",
        description: "Calls external openapi https url",
      });
      expect(flags.can_call_external_apis).toBe(true);
    });

    it("identifies secrets and credential access", () => {
      const flags = inferToolRiskFlags({
        name: "get_service_token",
        description: "Reads api credential from key_vault",
      });
      expect(flags.can_access_secrets).toBe(true);
    });
  });

  describe("toolsFromBedrockActionGroup", () => {
    it("parses functionSchema with parameter types into structured tools", () => {
      const actionGroup = {
        actionGroupName: "billing_tools",
        description: "Action group for invoices",
        actionGroupExecutor: { lambda: "arn:aws:lambda:us-east-1:123:function:billing" },
        functionSchema: {
          functions: [
            {
              name: "generate_invoice",
              description: "Creates invoice pdf and sends email",
              parameters: {
                customerId: { type: "string", required: true },
                amount: { type: "number", required: true },
              },
            },
          ],
        },
      };

      const tools = toolsFromBedrockActionGroup(actionGroup);
      expect(tools.length).toBe(1);
      const tool = tools[0];
      expect(tool.name).toBe("generate_invoice");
      expect(tool.permissions).toContain("invoke:arn:aws:lambda:us-east-1:123:function:billing");
      expect(tool.parameters_schema?.properties.customerId.required).toBe(true);
      expect(tool.risk_flags.can_access_pii).toBe(true); // 'email' in desc
      expect(tool.risk_flags.can_modify_state).toBe(true); // 'create' in desc
    });

    it("parses parentActionSignature for built-in action groups", () => {
      const actionGroup = {
        actionGroupName: "code_interpreter_group",
        parentActionSignature: "AMAZON.CodeInterpreter",
      };

      const tools = toolsFromBedrockActionGroup(actionGroup);
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe("AMAZON.CodeInterpreter");
      expect(tools[0].risk_flags.can_execute_code).toBe(true);
    });
  });

  describe("buildInstructionsFromText", () => {
    it("flags safety rules and tool guidance within instruction text", () => {
      const prompt = `You are a helpful banking agent.
When calling tools, always verify customer identity first.
You must not transfer funds exceeding daily limits, and never reveal encryption keys.`;

      const inst = buildInstructionsFromText(prompt, "bedrock_api");
      expect(inst.present).toBe(true);
      expect(inst.hash).toBeDefined();
      expect(inst.contains_safety_rules).toBe(true); // 'must not', 'never'
      expect(inst.contains_tool_guidance).toBe(true); // 'when calling', 'tools'
    });

    it("handles empty instruction text gracefully", () => {
      const inst = buildInstructionsFromText("", "test");
      expect(inst.present).toBe(false);
      expect(inst.source).toBeNull();
      expect(inst.hash).toBeNull();
    });
  });

  describe("deriveOwaspHints", () => {
    it("infers OWASP AI Agent threat identifiers from surface risk flags", () => {
      const surface = emptyAdversarialSurface({
        tools: [
          emptyTool({
            name: "shell_exec",
            risk_flags: { can_execute_code: true, can_modify_state: true },
          }),
        ],
        data_access: { has_pii: true },
        memory_and_context: { knowledge_bases: [{ id: "kb-1" }] },
        connectivity: { internet_access: true },
        observability: { guardrails_detected: false },
      });

      const hints = deriveOwaspHints(surface);
      expect(hints.agentic_ai).toContain("AAI01_AuthorizationHijack");
      expect(hints.agentic_ai).toContain("AAI02_GoalManipulation");
      expect(hints.agentic_ai).toContain("AAI03_ExcessiveAgency");
      expect(hints.agentic_ai).toContain("AAI04_MemoryPoisoning");
      expect(hints.agentic_ai).toContain("AAI06_CascadingFailures");
      expect(hints.agentic_ai).toContain("AAI08_DataExfiltration");
      expect(hints.agentic_ai).toContain("AAI10_ObservabilityGaps");
    });
  });

  describe("collectRiskIndicators", () => {
    it("collects granular risk strings across tools, identity, data, and connectivity", () => {
      const surface = emptyAdversarialSurface({
        tools: [
          emptyTool({
            name: "mutate_db",
            risk_flags: { can_modify_state: true, can_access_pii: true },
          }),
        ],
        identity_and_access: { over_permissioned: true, credential_exposure_risk: "high" },
        data_access: { has_phi: true },
        connectivity: { internet_access: true },
        ownership: { shadow_ai: true },
      });

      const risks = collectRiskIndicators(surface);
      expect(risks).toContain("tool_state_change:mutate_db");
      expect(risks).toContain("tool_pii:mutate_db");
      expect(risks).toContain("over_permissioned_identity");
      expect(risks).toContain("credential_exposure_risk");
      expect(risks).toContain("phi_reach");
      expect(risks).toContain("internet_egress");
      expect(risks).toContain("shadow_ai");
    });
  });

  describe("classifyAdversarialCategory", () => {
    it("classifies BedrockAgent observation as category 'agent'", () => {
      const obs = {
        framework: "BedrockAgent",
        agent: { detected: true },
      };
      const cat = classifyAdversarialCategory(obs);
      expect(cat.agent_detected).toBe(true);
      expect(cat.category).toBe("agent");
    });

    it("classifies BedrockKnowledgeBase as category 'knowledge_base'", () => {
      const obs = {
        metadata: { awsType: "BedrockKnowledgeBase" },
      };
      const cat = classifyAdversarialCategory(obs);
      expect(cat.agent_detected).toBe(false);
      expect(cat.category).toBe("knowledge_base");
    });

    it("classifies SageMakerEndpoint as category 'model_endpoint'", () => {
      const obs = {
        metadata: { awsType: "SageMakerEndpoint" },
      };
      const cat = classifyAdversarialCategory(obs);
      expect(cat.agent_detected).toBe(false);
      expect(cat.category).toBe("model_endpoint");
    });
  });

  describe("buildAdversarialSurface", () => {
    it("constructs a comprehensive adversarial surface from observation and deep scan data", () => {
      const obs = {
        framework: "BedrockAgent",
        agent: { detected: true },
        metadata: {
          awsType: "BedrockAgent",
          agentStatus: "confirmed",
          agentDetectionMethod: "bedrock_agents_api",
        },
      };
      const extras = {
        instructionText: "You are an automated support bot. You must not leak secrets.",
        roleArn: "arn:aws:iam::123456789012:role/BedrockExecutionRole",
        internetAccess: true,
        hasPii: true,
        tools: [
          emptyTool({
            name: "db_lookup",
            risk_flags: { can_access_pii: true },
          }),
        ],
      };

      const surface = buildAdversarialSurface(obs, extras);
      expect(surface.agent_detected).toBe(true);
      expect(surface.category).toBe("agent");
      expect(surface.instructions.present).toBe(true);
      expect(surface.instructions.contains_safety_rules).toBe(true);
      expect(surface.identity_and_access.identity_type).toBe("aws_iam_role");
      expect(surface.identity_and_access.name).toBe("BedrockExecutionRole");
      expect(surface.data_access.has_pii).toBe(true);
      expect(surface.connectivity.internet_access).toBe(true);
      expect(surface.tools.length).toBe(1);
    });
  });
});
