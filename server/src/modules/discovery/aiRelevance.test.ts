import { describe, it, expect } from "vitest";
import {
  isAiRelevantText,
  isAiAgentProcess,
  classifyAzureResource,
  classifyAwsResource,
  classifyGcpResource,
  isAwsAiResource,
  isGcpAiResource,
  AZURE_NEVER_AGENT_TYPES,
  AZURE_AI_TYPE_ALWAYS,
} from "./aiRelevance";

describe("AI Relevance and Workload Discovery Classifier", () => {
  describe("isAiRelevantText", () => {
    it("matches core AI keywords, agent frameworks, and LLM platforms", () => {
      expect(isAiRelevantText("openai-chat-service")).toBe(true);
      expect(isAiRelevantText("bedrock-customer-assistant")).toBe(true);
      expect(isAiRelevantText("crewai-research-agent")).toBe(true);
      expect(isAiRelevantText("langchain-document-qa")).toBe(true);
      expect(isAiRelevantText("claude-summarizer")).toBe(true);
      expect(isAiRelevantText("gemini-translation-bot")).toBe(true);
      expect(isAiRelevantText("ollama-local-llm")).toBe(true);
      expect(isAiRelevantText("mcp-filesystem-server")).toBe(true);
      expect(isAiRelevantText("sagemaker-inference-endpoint")).toBe(true);
      expect(isAiRelevantText("github-copilot-integration")).toBe(true);
      expect(isAiRelevantText("agentforce-sales-bot")).toBe(true);
    });

    it("rejects generic non-AI infrastructure names", () => {
      expect(isAiRelevantText("postgres-user-db")).toBe(false);
      expect(isAiRelevantText("auth-service-v2")).toBe(false);
      expect(isAiRelevantText("stripe-billing-webhook")).toBe(false);
      expect(isAiRelevantText("nginx-ingress-controller")).toBe(false);
      expect(isAiRelevantText("redis-cache-cluster")).toBe(false);
      expect(isAiRelevantText("rabbitmq-event-bus")).toBe(false);
    });

    it("handles multiple string parts and ignores null/undefined", () => {
      expect(isAiRelevantText(null, "production", undefined, "gpt-4o-pipeline")).toBe(true);
      expect(isAiRelevantText(null, "production", undefined, "standard-db")).toBe(false);
    });
  });

  describe("isAiAgentProcess", () => {
    it("identifies local AI engines, agent CLI tools, and MCP servers", () => {
      expect(isAiAgentProcess("ollama serve")).toBe(true);
      expect(isAiAgentProcess("python -m langchain.agents.executor")).toBe(true);
      expect(isAiAgentProcess("/usr/local/bin/cursor-agent --port 3000")).toBe(true);
      expect(isAiAgentProcess("npx -y @modelcontextprotocol/server-postgres")).toBe(true);
      expect(isAiAgentProcess("vllm --model meta-llama/Llama-3-8B")).toBe(true);
      expect(isAiAgentProcess("claude-code --interactive")).toBe(true);
      expect(isAiAgentProcess("aider --model gpt-4o")).toBe(true);
    });

    it("returns false for standard operating system and web server processes", () => {
      expect(isAiAgentProcess("node dist/index.js")).toBe(false);
      expect(isAiAgentProcess("nginx: master process /usr/sbin/nginx")).toBe(false);
      expect(isAiAgentProcess("postgres -D /var/lib/postgresql/data")).toBe(false);
      expect(isAiAgentProcess("redis-server *:6379")).toBe(false);
      expect(isAiAgentProcess("sshd: /usr/sbin/sshd -D")).toBe(false);
      expect(isAiAgentProcess(null)).toBe(false);
      expect(isAiAgentProcess("")).toBe(false);
    });
  });

  describe("Azure Resource Classification", () => {
    it("always classifies official AI platforms as AI relevant", () => {
      const openAiResource = {
        id: "/subscriptions/sub-1/resourceGroups/rg-ai/providers/Microsoft.CognitiveServices/accounts/corp-openai",
        name: "corp-openai",
        type: "Microsoft.CognitiveServices/accounts",
        kind: "OpenAI",
      };
      const res = classifyAzureResource(openAiResource);
      expect(res.aiRelevant).toBe(true);
      expect(res.category).toBe("azure_openai");
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it("unconditionally rejects supporting infrastructure types, even if named with AI keywords", () => {
      // Key Vault named "openai-agent-keyvault"
      const kvResource = {
        id: "/subscriptions/sub-1/resourceGroups/rg-ai/providers/Microsoft.KeyVault/vaults/openai-agent-keyvault",
        name: "openai-agent-keyvault",
        type: "Microsoft.KeyVault/vaults",
        tags: { role: "agent-keys", app: "bedrock-agent" },
      };
      const res = classifyAzureResource(kvResource);
      expect(res.aiRelevant).toBe(false);
      expect(res.category).toBe("non_ai");
      expect(res.evidence[0]).toContain("supporting infrastructure, never an AI agent");

      // Storage account named "agentstoragefoundry"
      const storageResource = {
        id: "/subscriptions/sub-1/resourceGroups/rg-ai/providers/Microsoft.Storage/storageAccounts/agentstoragefoundry",
        name: "agentstoragefoundry",
        type: "Microsoft.Storage/storageAccounts",
      };
      const storageRes = classifyAzureResource(storageResource);
      expect(storageRes.aiRelevant).toBe(false);
      expect(storageRes.category).toBe("non_ai");
    });

    it("classifies conditional compute as AI relevant only when AI signals/names are present", () => {
      // Container App hosting an agent
      const aiContainerApp = {
        name: "agent-research-assistant",
        type: "Microsoft.App/containerApps",
        tags: { environment: "production" },
      };
      const res1 = classifyAzureResource(aiContainerApp);
      expect(res1.aiRelevant).toBe(true);
      expect(res1.layer).toBe("compute_candidate");

      // Container App hosting non-AI service
      const nonAiContainerApp = {
        name: "shopping-cart-api",
        type: "Microsoft.App/containerApps",
        tags: { team: "checkout" },
      };
      const res2 = classifyAzureResource(nonAiContainerApp);
      expect(res2.aiRelevant).toBe(false);
      expect(res2.category).toBe("non_ai");
    });
  });

  describe("AWS Resource Classification", () => {
    it("classifies Bedrock Agents as AI agents", () => {
      const bedrockAgent = {
        id: "arn:aws:bedrock:us-east-1:123456789012:agent/AGENT12345",
        name: "ClaimsProcessingAgent",
        awsType: "BedrockAgent",
        service: "bedrock",
      };
      const res = classifyAwsResource(bedrockAgent);
      expect(res.aiRelevant).toBe(true);
      expect(res.category).toBe("bedrock_agent");
      expect(res.layer).toBe("agent");
      expect(isAwsAiResource(bedrockAgent)).toBe(true);
    });

    it("classifies Bedrock Knowledge Bases as AI resources (knowledge base)", () => {
      const bedrockKb = {
        name: "PolicyDocKnowledgeBase",
        awsType: "BedrockKnowledgeBase",
        service: "bedrock",
      };
      const res = classifyAwsResource(bedrockKb);
      expect(res.aiRelevant).toBe(true);
      expect(res.category).toBe("bedrock_knowledge_base");
      expect(res.layer).toBe("ai_resource");
    });

    it("classifies SageMaker endpoints as model serving resources", () => {
      const endpoint = {
        name: "llama3-70b-realtime-endpoint",
        awsType: "SageMakerEndpoint",
        service: "sagemaker",
      };
      const res = classifyAwsResource(endpoint);
      expect(res.aiRelevant).toBe(true);
      expect(res.category).toBe("sagemaker_endpoint");
      expect(res.layer).toBe("ai_resource");
    });

    it("classifies Lambda only when AI heuristics match", () => {
      const aiLambda = {
        name: "process-gpt4o-agent-action",
        type: "AWS::Lambda::Function",
      };
      expect(isAwsAiResource(aiLambda)).toBe(true);

      const nonAiLambda = {
        name: "daily-db-backup-trigger",
        type: "AWS::Lambda::Function",
      };
      expect(isAwsAiResource(nonAiLambda)).toBe(false);
    });
  });

  describe("GCP Resource Classification", () => {
    it("classifies Dialogflow CX agents as agent layer", () => {
      const dialogflowAgent = {
        name: "customer-service-cx-agent",
        type: "DialogflowCxAgent",
        service: "dialogflow",
      };
      const res = classifyGcpResource(dialogflowAgent);
      expect(res.aiRelevant).toBe(true);
      expect(res.category).toBe("dialogflow_cx_agent");
      expect(res.layer).toBe("agent");
      expect(isGcpAiResource(dialogflowAgent)).toBe(true);
    });

    it("classifies Vertex AI Reasoning Engines as agent layer", () => {
      const reasoningEngine = {
        name: "langchain-reasoning-engine",
        type: "VertexReasoningEngine",
      };
      const res = classifyGcpResource(reasoningEngine);
      expect(res.aiRelevant).toBe(true);
      expect(res.category).toBe("vertex_reasoning_engine");
      expect(res.layer).toBe("agent");
    });

    it("classifies Vertex AI Endpoints as AI resource layer", () => {
      const endpoint = {
        name: "gemini-pro-endpoint",
        type: "VertexAIEndpoint",
      };
      const res = classifyGcpResource(endpoint);
      expect(res.aiRelevant).toBe(true);
      expect(res.layer).toBe("ai_resource");
    });

    it("classifies Cloud Run based on container image and text signals", () => {
      const aiCloudRun = {
        name: "research-copilot",
        type: "CloudRunService",
        service: "run",
        images: ["gcr.io/my-project/agent-worker:v1"],
      };
      expect(isGcpAiResource(aiCloudRun)).toBe(true);

      const nonAiCloudRun = {
        name: "static-assets-server",
        type: "CloudRunService",
        service: "run",
        images: ["nginx:alpine"],
      };
      expect(isGcpAiResource(nonAiCloudRun)).toBe(false);
    });
  });
});
