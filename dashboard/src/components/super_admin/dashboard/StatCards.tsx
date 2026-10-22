import { useNavigate } from "react-router-dom";
import StatCard from "../../shared/StatCard";
import type { DashboardData } from "../../../types/dashboard";

interface StatCardsProps {
  stats: DashboardData["stats"];
  alerts: DashboardData["alerts"];
}

export default function StatCards({ stats }: StatCardsProps) {
  const navigate = useNavigate();

  const navigateToAgents = (status?: string) => {
    if (status === "shadow") {
      navigate("/agents/shadow");
    } else if (status === "approved") {
      navigate("/agents/verified");
    } else {
      navigate("/agents");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        color="royal"
        label="TOTAL AGENTS"
        value={stats.totalAgents}
        sub="across all sources"
        trend="Discovered"
        onClick={() => navigateToAgents()}
      />
      <StatCard
        color="green"
        label="APPROVED AGENTS"
        value={stats.approvedAgents}
        sub="governed &amp; compliant"
        trend="Compliant"
        onClick={() => navigateToAgents("approved")}
      />
      <StatCard
        color="amber"
        label="SHADOW AGENTS"
        value={stats.shadowAgents}
        sub="unauthorized "
        trend={stats.shadowAgents > 0 ? "Review Required" : "Zero Detected"}
        onClick={() => navigateToAgents("shadow")}
      />
      <StatCard
        color="royal"
        label="AVG. CONFIDENCE"
        value={`${stats.avgConfidence}%`}
        sub="discovery accuracy"
        trend="High Accuracy"
        onClick={() => navigate("/agents")}
      />
    </div>
  );
}
