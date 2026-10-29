import { describe, it, expect, vi } from "vitest";
import { getSecurityPostureData } from "./dashboard.service";

describe("getSecurityPostureData", () => {
  it("returns structured posture data with all 11 required dashboard sections", async () => {
    const data = await getSecurityPostureData(null, "30d", "all");
    
    // 1. Overall Risk
    expect(data.overallRisk).toBeDefined();
    expect(typeof data.overallRisk.score).toBe("number");
    expect(data.overallRisk.maxScore).toBe(100);
    expect(data.overallRisk.headline).toBeDefined();
    
    // 2. KPIs
    expect(data.kpis).toBeDefined();
    expect(data.kpis.criticalRiskAgents.value).toBeGreaterThanOrEqual(0);
    expect(data.kpis.highRiskAgents.value).toBeGreaterThanOrEqual(0);
    expect(data.kpis.shadowAgents.value).toBeGreaterThanOrEqual(0);
    expect(data.kpis.sensitiveAccess.value).toBeGreaterThanOrEqual(0);

    // 3. Governance Coverage (User's exact specification)
    expect(data.governanceCoverage).toBeDefined();
    expect(data.governanceCoverage.segments.length).toBe(4);
    const keys = data.governanceCoverage.segments.map((s) => s.key);
    expect(keys).toContain("approved");
    expect(keys).toContain("shadow");
    expect(keys).toContain("unverified_model");
    expect(keys).toContain("unknown");

    // 4. Risk Distribution
    expect(data.riskDistribution).toBeDefined();
    expect(data.riskDistribution.length).toBe(4);

    // 5. Risk Drivers
    expect(data.riskDrivers).toBeDefined();
    expect(data.riskDrivers.length).toBe(5);

    // 6. Capability Exposure
    expect(data.capabilityExposure).toBeDefined();
    expect(data.capabilityExposure.length).toBe(8);

    // 7. OWASP Framework
    expect(data.owaspFramework).toBeDefined();
    expect(data.owaspFramework.length).toBe(7);

    // 8. Top Models
    expect(data.topModels).toBeDefined();
    expect(data.topModels.length).toBeGreaterThanOrEqual(1);

    // 9. Trend Points
    expect(data.riskScoreTrend).toBeDefined();
    expect(data.riskScoreTrend.length).toBe(5);

    // 10. Recent Events
    expect(data.recentEvents).toBeDefined();
    expect(data.recentEvents.length).toBeGreaterThanOrEqual(1);

    // 11. Environments
    expect(data.environments).toBeDefined();
    expect(data.environments.segments.length).toBe(5);
  });
});
