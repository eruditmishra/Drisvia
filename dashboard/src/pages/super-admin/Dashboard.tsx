import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI } from "../../lib/api";
import { useDashboardFilter } from "../../store/useDashboardFilter";
import type { PostureDashboardData } from "../../types/dashboard";
import useStore from "../../store/useStore";

import OverallRiskScoreCard from "../../components/super_admin/posture/OverallRiskScoreCard";
import PostureKpiCards from "../../components/super_admin/posture/PostureKpiCards";
import GovernanceCoverageCard from "../../components/super_admin/posture/GovernanceCoverageCard";
import RiskDistributionCard from "../../components/super_admin/posture/RiskDistributionCard";
import RiskDriversCard from "../../components/super_admin/posture/RiskDriversCard";
import CapabilityExposureCard from "../../components/super_admin/posture/CapabilityExposureCard";
import OwaspFrameworkCard from "../../components/super_admin/posture/OwaspFrameworkCard";
import TopModelsCard from "../../components/super_admin/posture/TopModelsCard";
import RiskScoreTrendCard from "../../components/super_admin/posture/RiskScoreTrendCard";
import RecentViolationsCard from "../../components/super_admin/posture/RecentViolationsCard";
import EnvironmentsCard from "../../components/super_admin/posture/EnvironmentsCard";

interface GreetingInfo {
  greeting: string;
  subMessage: string;
}

function getGreetingInfo(): GreetingInfo {
  const hour = new Date().getHours();
  // Morning: 05:00 - 11:59
  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good morning",
      subMessage: "Ready to get started?",
    };
  }
  // Afternoon: 12:00 - 16:59
  if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good afternoon",
      subMessage: "Here's your security overview.",
    };
  }
  // Evening: 17:00 - 22:59
  if (hour >= 17 && hour < 23) {
    return {
      greeting: "Good evening",
      subMessage: "Here's what needs your attention.",
    };
  }
  // Late night: 23:00 - 04:59
  return {
    greeting: "Welcome back",
    subMessage: "Your security overview is ready.",
  };
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "Admin";
  const trimmed = fullName.trim();
  if (!trimmed) return "Admin";
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { period, environment, setPeriod, setEnvironment } =
    useDashboardFilter();
  const user = useStore((s) => s.user);
  const [data, setData] = useState<PostureDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const greetingInfo = getGreetingInfo();
  const firstName = getFirstName(user?.name);

  const fetchPosture = () => {
    setLoading(true);
    setError(null);
    dashboardAPI
      .getSecurityPosture({ period, environment })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load security posture data", err);
        setError("Could not retrieve AI security posture telemetry.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosture();

    const handleScanComplete = () => {
      fetchPosture();
    };
    window.addEventListener("drisvia:scan-completed", handleScanComplete);
    return () => {
      window.removeEventListener("drisvia:scan-completed", handleScanComplete);
    };
  }, [period, environment]);

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
          <span className="text-xs font-semibold text-slate-500">
            Loading AI Security Posture telemetry...
          </span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <ShieldCheck className="mx-auto text-blue-600 mb-3" size={36} />
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Unable to Load Dashboard
          </h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchPosture}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-8 pb-8 pt-3 flex flex-col gap-6 h-full overflow-y-auto bg-[#F9FBFE] custom-scrollbar">
      {/* ── Page Header ── */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-[#1D2329]">
          {greetingInfo.greeting}, {firstName}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {greetingInfo.subMessage}
        </p>
      </div>

      {/* ── ROW 1: Overall Risk Score Card + 4 KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <OverallRiskScoreCard data={data.overallRisk} />
        </div>
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PostureKpiCards
            kpis={data.kpis}
            onNavigate={(path) => navigate(path)}
          />
        </div>
      </div>

      {/* ── ROW 2: Governance Coverage, Risk Distribution & Risk Drivers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GovernanceCoverageCard
          data={data.governanceCoverage}
          onSelectSegment={() => navigate("/agents")}
        />
        <RiskDistributionCard data={data.riskDistribution} />
        <RiskDriversCard data={data.riskDrivers} />
      </div>

      {/* ── ROW 3: Capability Exposure, OWASP Framework & Top Models ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CapabilityExposureCard data={data.capabilityExposure} />
        <OwaspFrameworkCard data={data.owaspFramework} />
        <TopModelsCard data={data.topModels} />
      </div>

      {/* ── ROW 4: Risk Score Trend, Recent Security Events & Environments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6">
        <RiskScoreTrendCard
          data={data.riskScoreTrend}
          period={period}
          onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
        />
        <RecentViolationsCard data={data.recentViolations} />
        <EnvironmentsCard
          data={data.environments}
          onSelectEnvironment={(env) => {
            const lower = env.toLowerCase();
            if (lower.includes("aws")) setEnvironment("aws");
            else if (lower.includes("azure")) setEnvironment("azure");
            else if (lower.includes("google")) setEnvironment("gcp");
            else if (lower.includes("on-prem")) setEnvironment("on_prem");
            else setEnvironment("all");
          }}
        />
      </div>
    </div>
  );
}
