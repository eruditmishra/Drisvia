export interface DashboardData {
  stats: {
    totalAgents: number;
    approvedAgents: number;
    shadowAgents: number;
    avgConfidence: number;
  };
  charts: {
    models: { name: string; value: number }[];
    risk: { name: string; value: number }[];
    provider: { name: string; value: number }[];
  };
  recentScans: {
    id: string;
    status: string;
    time: string;
    error: string | null;
    type: string;
    agentsFound: number;
    providersScanned: string[];
  }[];
  alerts: {
    sev: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
  }[];
}

export interface ShadowAgentStats {
  totalShadowAgents: number;
  atRiskAgents: number;
  rogueAgents: number;
  ownerless: number;
}

export interface ModelStats {
  totalModels: number;
  approvedModels: number;
  rejectedModels: number;
  pendingModels: number;
}

export interface VerifiedAgentStats {
  totalVerified: number;
  autoVerified: number;
  conditionallyVerified: number;
  underReview: number;
}

export interface PostureDashboardData {
  overallRisk: {
    score: number;
    maxScore: number;
    level: string;
    headline: string;
    description: string;
    delta: number | null;
    deltaDirection: "up" | "down" | "flat";
    deltaPeriod: string;
  };
  kpis: {
    criticalRiskAgents: { value: number; delta: number | null; deltaPeriod: string };
    highRiskAgents: { value: number; delta: number | null; deltaPeriod: string };
    shadowAgents: { value: number; delta: number | null; deltaPeriod: string };
    sensitiveAccess: { value: number; delta: number | null; deltaPeriod: string };
  };
  governanceCoverage: {
    totalAgents: number;
    segments: Array<{
      key: "approved" | "shadow" | "unverified_model" | "unknown";
      label: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
  riskDistribution: Array<{
    level: "Critical" | "High" | "Medium" | "Low";
    count: number;
    color: string;
  }>;
  riskDrivers: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  capabilityExposure: Array<{
    capabilityId: string;
    label: string;
    icon: string;
    agentCount: number;
    riskLevel: "High" | "Medium" | "Low";
  }>;
  owaspFramework: Array<{
    code: string;
    category: string;
    icon: string;
    affectedAgents: number;
    trend: number | null;
  }>;
  topModels: Array<{
    modelName: string;
    provider: string;
    agentCount: number;
    riskLevel: "High" | "Medium" | "Low";
  }>;
  riskScoreTrend: Array<{
    date: string;
    score: number;
  }>;
  recentEvents: Array<{
    id: string;
    timeAgo: string;
    title: string;
    agentName: string;
    severity: "Critical" | "High" | "Medium" | "Low";
  }>;
  environments: {
    totalAgents: number;
    segments: Array<{
      provider: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
}

