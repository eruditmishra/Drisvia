import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { dashboardAPI } from "../../lib/api";
import type { DashboardData } from "../../types/dashboard";
import StatCards from "../../components/super_admin/dashboard/StatCards";
import PieCharts from "../../components/super_admin/dashboard/PieCharts";
import RecentScans from "../../components/super_admin/dashboard/RecentScans";
import ActiveAlerts from "../../components/super_admin/dashboard/ActiveAlerts";
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    dashboardAPI
      .getStats()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();

    const handleScanComplete = () => {
      fetchStats();
    };
    window.addEventListener("drisvia:scan-completed", handleScanComplete);
    return () => {
      window.removeEventListener("drisvia:scan-completed", handleScanComplete);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#F4F8FD]/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#2563EB]/20 border-t-[#2563EB]"></div>
          <span className="text-xs font-semibold text-text-muted">
            Loading AI Governance telemetry...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-text-muted bg-[#F4F8FD]/50">
        <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE7F9] shadow-sm max-w-md">
          <ShieldCheck className="mx-auto text-[#2563EB] mb-3" size={36} />
          <h3 className="text-sm font-bold text-text-primary mb-1">
            Unable to Load Dashboard
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Could not retrieve governance telemetry from the server.
          </p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#2563EB]/30 hover:bg-[#1d4ed8] transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-2 flex flex-col gap-5 h-full overflow-y-auto animate-view-in custom-scrollbar">

      {/* ── Stats Section ── */}
      <StatCards stats={data.stats} alerts={data.alerts} />

      {/* ── Charts Section ── */}
      <PieCharts charts={data.charts} />

      {/* ── Recent Scans & Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-2">
        <RecentScans scans={data.recentScans} />
        <ActiveAlerts alerts={data.alerts} />
      </div>
    </div>
  );
}
