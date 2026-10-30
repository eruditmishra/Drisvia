import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Bot,
  Box,
  Layers,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Timer,
} from "lucide-react";
import { discoveryAPI, dashboardAPI } from "../../lib/api";

interface ScanRecord {
  id: string;
  tenant_id: string | null;
  integration_ids: string[];
  scan_all: boolean;
  status: "pending" | "running" | "completed" | "failed";
  triggered_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  stats: {
    totalAgents?: number;
    newAgents?: number;
    totalModels?: number;
    newModels?: number;
    byIntegration?: Record<
      string,
      {
        found?: number;
        models?: number;
        errors?: number;
        newAgents?: number;
        newModels?: number;
      }
    >;
  } | null;
  created_at: string;
}

interface ScanIntegration {
  id: string;
  scan_id: string;
  integration_id: string;
  provider: string;
  integration_name: string;
  status: "pending" | "running" | "completed" | "failed";
  agents_found: number;
  models_found: number;
  errors: any[];
  started_at: string | null;
  completed_at: string | null;
}

interface ScanDetailData extends ScanRecord {
  integrations?: ScanIntegration[];
  agents?: Array<{
    id: string;
    name: string;
    model: string | null;
    status: string;
    risk_score?: number | null;
    deployment_type?: string | null;
    is_new?: boolean;
  }>;
  models?: Array<{
    id: string;
    name: string;
    provider: string | null;
    model_type?: string | null;
    risk_level?: string | null;
    validation_status?: string | null;
    agent_count?: number;
    is_new?: boolean;
  }>;
}

export default function ScanHistory() {
  const navigate = useNavigate();

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exact system counts (matching All Agents and Models pages)
  const [totalAgentsCount, setTotalAgentsCount] = useState<number>(27);
  const [totalModelsCount, setTotalModelsCount] = useState<number>(5);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect modal / drawer
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [scanDetail, setScanDetail] = useState<ScanDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalAgentFilter, setModalAgentFilter] = useState<"all" | "new">(
    "all",
  );
  const [modalModelFilter, setModalModelFilter] = useState<"all" | "new">(
    "all",
  );

  // Active scan trigger state
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchOverallCounts = async () => {
    try {
      const [agentsRes, modelsRes] = await Promise.all([
        discoveryAPI.getAgents({ excludeIdentities: true, limit: 1 }),
        dashboardAPI.getModelStats(),
      ]);
      if (typeof agentsRes.data?.total === "number") {
        setTotalAgentsCount(agentsRes.data.total);
      }
      if (typeof modelsRes.data?.totalModels === "number") {
        setTotalModelsCount(modelsRes.data.totalModels);
      }
    } catch (e) {
      console.error("Failed to fetch aggregate counts", e);
    }
  };

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const [scansRes] = await Promise.all([
        discoveryAPI.listScans({ limit: 100 }),
        fetchOverallCounts(),
      ]);
      setScans(scansRes.data?.scans || []);
    } catch (err: any) {
      console.error("Failed to load scans", err);
      setError(err?.message || "Failed to load scan history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  // Live timer for active scans duration ticker
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const isScanRunning =
      scanDetail?.status === "running" ||
      scans.some((s) => s.status === "running" || s.status === "pending");

    if (!isScanRunning) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [scanDetail?.status, scans]);

  // Listen for scan completion events from Header to auto-refresh
  useEffect(() => {
    const handleScanDone = () => {
      fetchScans();
      if (selectedScanId) {
        discoveryAPI
          .getScan(selectedScanId)
          .then((res) => {
            if (res.data?.scan) setScanDetail(res.data.scan);
          })
          .catch(console.error);
      }
    };
    window.addEventListener("drisvia:scan-completed", handleScanDone);
    return () =>
      window.removeEventListener("drisvia:scan-completed", handleScanDone);
  }, [selectedScanId]);

  // Auto-poll active scan detail while modal is open and scan is running
  useEffect(() => {
    if (!selectedScanId) return;
    if (
      scanDetail &&
      scanDetail.status !== "running" &&
      scanDetail.status !== "pending"
    ) {
      return;
    }

    let isMounted = true;

    const poll = async () => {
      try {
        const res = await discoveryAPI.getScan(selectedScanId);
        if (!isMounted) return;
        const fresh = res.data?.scan;
        if (fresh) {
          setScanDetail(fresh);
          if (fresh.status === "completed" || fresh.status === "failed") {
            fetchScans();
            window.dispatchEvent(
              new CustomEvent("drisvia:scan-completed", { detail: fresh }),
            );
          }
        }
      } catch (err) {
        console.error("Failed to poll scan diagnostics", err);
      }
    };

    // Poll every 1.5 seconds for snappy updates
    const interval = setInterval(poll, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedScanId, scanDetail?.status]);

  // Auto-poll scans list when any background scan is in progress
  useEffect(() => {
    const hasRunning = scans.some(
      (s) => s.status === "running" || s.status === "pending",
    );
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const [scansRes] = await Promise.all([
          discoveryAPI.listScans({ limit: 100 }),
          fetchOverallCounts(),
        ]);
        setScans(scansRes.data?.scans || []);
      } catch (err) {
        console.error("Failed to poll scan history", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [scans]);

  // Load detailed scan
  const handleOpenDetail = async (scanId: string) => {
    setSelectedScanId(scanId);
    setDetailLoading(true);
    setModalAgentFilter("all");
    setModalModelFilter("all");
    try {
      const res = await discoveryAPI.getScan(scanId);
      setScanDetail(res.data?.scan || null);
    } catch (err) {
      console.error("Failed to load scan details", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefreshDetail = async (scanId: string) => {
    setDetailLoading(true);
    try {
      const res = await discoveryAPI.getScan(scanId);
      setScanDetail(res.data?.scan || null);
      if (
        res.data?.scan?.status === "completed" ||
        res.data?.scan?.status === "failed"
      ) {
        fetchScans();
      }
    } catch (err) {
      console.error("Failed to refresh scan details", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedScanId(null);
    setScanDetail(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerScan = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    try {
      const res = await discoveryAPI.startScan(undefined, true);
      const scanId = res.data?.scanId;
      if (scanId) {
        await fetchScans();
        handleOpenDetail(scanId);
      }
    } catch (err) {
      console.error("Failed to trigger scan", err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Duration helper with live ticking
  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start) return "—";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : now;
    const diffSec = Math.max(0, Math.round((endTime - startTime) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  };

  // Formatted date helper
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered scans
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const matchesStatus =
        statusFilter === "all" ? true : scan.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        scan.id.toLowerCase().includes(query) ||
        (scan.status && scan.status.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [scans, statusFilter, searchQuery]);

  // Aggregate stats
  const totalScans = scans.length;
  const completedScans = scans.filter((s) => s.status === "completed").length;
  const runningScans = scans.filter((s) => s.status === "running").length;

  return (
    <div className="px-8 pb-8 pt-4 flex flex-col gap-6 h-full overflow-y-auto bg-[#F9FBFE] custom-scrollbar">
      {/* ── Page Title Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D2329] flex items-center gap-2.5">
            <Radar className="w-6 h-6 text-[#2563EB]" />
            Scan History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical log of all automated and on-demand agent discovery scans
            across integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchScans}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Refresh Scan History"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-blue-600" : ""}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerScan}
            disabled={isTriggering}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 disabled:opacity-75 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Radar size={14} className={isTriggering ? "animate-spin" : ""} />
            <span>{isTriggering ? "Starting Scan..." : "Run New Scan"}</span>
          </button>
        </div>
      </div>

      {/* ── Stat KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Scans
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalScans}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across all configured integrations
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Radar size={20} />
          </div>
        </div>

        {/* Successful Scans */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {completedScans}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {runningScans > 0
                ? `${runningScans} in progress`
                : "All scans finished"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Total Discovered Agents */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Discovered Agents
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalAgentsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Active agents (excl. identities)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Bot size={20} />
          </div>
        </div>

        {/* Total Discovered Models */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Identified Models
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalModelsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Unique foundation models
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Box size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
          {[
            { key: "all", label: "All Scans", count: totalScans },
            { key: "completed", label: "Completed", count: completedScans },
            { key: "running", label: "Running", count: runningScans },
            {
              key: "failed",
              label: "Failed",
              count: scans.filter((s) => s.status === "failed").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-200/60 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Scan ID or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scans Table ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
            <p className="text-xs text-slate-500 font-medium">
              Loading scan history...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchScans}
              className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
              <Radar size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No scan records found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters to locate historical scans."
                : "No discovery scans have been triggered yet. Trigger a scan to discover AI agents across your integrations."}
            </p>
            <button
              onClick={handleTriggerScan}
              disabled={isTriggering}
              className="mt-4 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Run Your First Scan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[10.5px]">
                <tr>
                  <th className="py-3 px-4">Scan ID</th>
                  <th className="py-3 px-4">Scope & Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Agents Found</th>
                  <th className="py-3 px-4 text-center">Models Found</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((scan) => {
                  const agentsCount = scan.stats?.totalAgents ?? 0;
                  const modelsCount = scan.stats?.totalModels ?? 0;
                  const isRunning = scan.status === "running";
                  const isCompleted = scan.status === "completed";
                  const isFailed = scan.status === "failed";

                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(scan.id)}
                    >
                      {/* Scan ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11.5px] font-bold text-slate-900">
                            {scan.id.slice(0, 8)}...{scan.id.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(scan.id, scan.id);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
                            title="Copy full Scan UUID"
                          >
                            {copiedId === scan.id ? (
                              <Check size={11} className="text-emerald-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200/60 text-[#2563EB] font-semibold text-[11px]">
                          <Layers size={11} />
                          {scan.scan_all
                            ? "All Integrations"
                            : `${scan.integration_ids?.length || 1} Targeted`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2
                              size={12}
                              className="text-emerald-500"
                            />
                            Completed
                          </span>
                        )}
                        {isRunning && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] font-bold text-[11px] animate-pulse">
                            <RefreshCw
                              size={12}
                              className="animate-spin text-blue-600"
                            />
                            In Progress
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
                            <XCircle size={12} className="text-rose-500" />
                            Failed
                          </span>
                        )}
                        {scan.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                            <Clock size={12} className="text-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Agents Found */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-slate-800 bg-slate-100 text-[11.5px]">
                            <Bot size={12} className="text-slate-500" />
                            {agentsCount}
                          </span>
                          {scan.stats?.newAgents !== undefined && (
                            <span
                              className={`text-[10px] font-semibold ${
                                scan.stats.newAgents > 0
                                  ? "text-emerald-600 font-bold"
                                  : "text-slate-400"
                              }`}
                            >
                              {scan.stats.newAgents > 0
                                ? `+${scan.stats.newAgents} new`
                                : "0 new"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Models Found */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-slate-800 bg-slate-100 text-[11.5px]">
                            <Box size={12} className="text-slate-500" />
                            {modelsCount}
                          </span>
                          {scan.stats?.newModels !== undefined && (
                            <span
                              className={`text-[10px] font-semibold ${
                                scan.stats.newModels > 0
                                  ? "text-emerald-600 font-bold"
                                  : "text-slate-400"
                              }`}
                            >
                              {scan.stats.newModels > 0
                                ? `+${scan.stats.newModels} new`
                                : "0 new"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Executed At */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatDate(scan.created_at)}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Timer size={12} className="text-slate-400" />
                          <span>
                            {formatDuration(scan.started_at, scan.completed_at)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-over / Modal: Inspect Scan Details ── */}
      {selectedScanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Scan Diagnostics
                  </span>
                  {scanDetail?.status === "completed" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      COMPLETED
                    </span>
                  )}
                  {scanDetail?.status === "running" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse flex items-center gap-1">
                      <RefreshCw
                        size={10}
                        className="animate-spin text-blue-600"
                      />
                      RUNNING
                    </span>
                  )}
                  {scanDetail?.status === "failed" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                      FAILED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-base font-extrabold font-mono text-slate-900">
                    {selectedScanId}
                  </h2>
                  <button
                    onClick={() => handleCopy(selectedScanId, "modal")}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    title="Copy full UUID"
                  >
                    {copiedId === "modal" ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    selectedScanId && handleRefreshDetail(selectedScanId)
                  }
                  disabled={detailLoading}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Refresh Diagnostics"
                >
                  <RefreshCw
                    size={14}
                    className={
                      detailLoading ? "animate-spin text-blue-600" : ""
                    }
                  />
                </button>
                <button
                  onClick={handleCloseDetail}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              {detailLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
                  <p className="text-xs text-slate-500 font-medium">
                    Loading scan breakdown...
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Started At
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                        {formatDate(
                          scanDetail?.started_at || scanDetail?.created_at,
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Finished At
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                        {formatDate(scanDetail?.completed_at)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Total Duration
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                        {scanDetail?.status === "running" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                        )}
                        <span>
                          {formatDuration(
                            scanDetail?.started_at,
                            scanDetail?.completed_at,
                          )}
                        </span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Total Findings
                      </span>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        {scanDetail?.stats?.totalAgents ?? 0} Agents{" "}
                        {scanDetail?.stats?.newAgents !== undefined && (
                          <span className="text-[10.5px] text-emerald-600 font-semibold">
                            (+{scanDetail.stats.newAgents} new)
                          </span>
                        )}
                        , {scanDetail?.stats?.totalModels ?? 0} Models{" "}
                        {scanDetail?.stats?.newModels !== undefined && (
                          <span className="text-[10.5px] text-emerald-600 font-semibold">
                            (+{scanDetail.stats.newModels} new)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Live running banner */}
                  {scanDetail?.status === "running" && (
                    <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-blue-900 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <RefreshCw
                          size={15}
                          className="animate-spin text-blue-600 shrink-0"
                        />
                        <div>
                          <span className="font-bold">
                            Scan in progress...{" "}
                          </span>
                          {/* <span className="text-blue-700">
                            Polling backend every 1.5s as connectors discover AI assets and models.
                          </span> */}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-white/90 px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                        {formatDuration(
                          scanDetail?.started_at,
                          scanDetail?.completed_at,
                        )}
                      </span>
                    </div>
                  )}

                  {/* Connected Integrations & Per-Connector Breakdown */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                      <Layers size={14} className="text-blue-600" />
                      Integration Scanners
                    </h3>

                    {scanDetail?.integrations &&
                    scanDetail.integrations.length > 0 ? (
                      <div className="space-y-3">
                        {scanDetail.integrations.map((conn) => {
                          const hasErrors =
                            conn.errors &&
                            Array.isArray(conn.errors) &&
                            conn.errors.length > 0;
                          const isConnRunning = conn.status === "running";

                          return (
                            <div
                              key={conn.id}
                              className={`border rounded-2xl p-4 shadow-xs transition-colors ${
                                isConnRunning
                                  ? "border-blue-200 bg-blue-50/20"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    {conn.provider?.charAt(0).toUpperCase() ||
                                      "I"}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">
                                      {conn.integration_name || conn.provider}
                                    </div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                      Provider: {conn.provider}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                  <div className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    <Bot size={12} className="text-slate-500" />
                                    <span>{conn.agents_found} Agents</span>
                                  </div>
                                  <div className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    <Box size={12} className="text-slate-500" />
                                    <span>{conn.models_found} Models</span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                      conn.status === "completed"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : conn.status === "running"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
                                          : conn.status === "pending"
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}
                                  >
                                    {isConnRunning && (
                                      <RefreshCw
                                        size={9}
                                        className="animate-spin text-blue-600"
                                      />
                                    )}
                                    {conn.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              {/* Errors / Warnings from this connector */}
                              {hasErrors && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1.5">
                                    <AlertTriangle size={12} />
                                    <span>
                                      {conn.errors.length} Collector Advisory /
                                      Permission Notice
                                      {conn.errors.length > 1 ? "s" : ""}:
                                    </span>
                                  </div>
                                  <div className="max-h-28 overflow-y-auto space-y-1 custom-scrollbar">
                                    {conn.errors.map(
                                      (errItem: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-[10.5px] bg-amber-50/70 text-slate-700 border border-amber-200/60 p-2 rounded-lg font-mono leading-tight"
                                        >
                                          {errItem.error ||
                                            errItem.message ||
                                            JSON.stringify(errItem)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No per-integration breakdown available for this scan.
                      </p>
                    )}
                  </div>

                  {/* Discovered Agents in this Scan */}
                  {scanDetail?.agents &&
                    scanDetail.agents.length > 0 &&
                    (() => {
                      const totalAgentsInScan = scanDetail.agents.length;
                      const newAgentsInScan = scanDetail.agents.filter(
                        (a) => a.is_new,
                      ).length;
                      const displayedAgents =
                        modalAgentFilter === "new"
                          ? scanDetail.agents.filter((a) => a.is_new)
                          : scanDetail.agents;

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <Bot size={14} className="text-purple-600" />
                                Agents Discovered ({totalAgentsInScan})
                              </h3>
                              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setModalAgentFilter("all")}
                                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                    modalAgentFilter === "all"
                                      ? "bg-white text-slate-900 shadow-xs"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  All ({totalAgentsInScan})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModalAgentFilter("new")}
                                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                                    modalAgentFilter === "new"
                                      ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                                      : "text-slate-500 hover:text-emerald-700"
                                  }`}
                                >
                                  <span>Newly Detected</span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                                    {newAgentsInScan}
                                  </span>
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                handleCloseDetail();
                                navigate("/agents");
                              }}
                              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View in All Agents
                              <ExternalLink size={11} />
                            </button>
                          </div>

                          {displayedAgents.length === 0 ? (
                            <div className="border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 bg-slate-50/50">
                              No net-new agents were introduced in this scan
                              (all {totalAgentsInScan} were pre-existing).
                            </div>
                          ) : (
                            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#F8FAFC] border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                                  <tr>
                                    <th className="py-2.5 px-3">Agent Name</th>
                                    <th className="py-2.5 px-3">Model</th>
                                    <th className="py-2.5 px-3">Risk Level</th>
                                    <th className="py-2.5 px-3 text-right">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {displayedAgents.map((agent) => (
                                    <tr
                                      key={agent.id}
                                      className="hover:bg-slate-50/70"
                                    >
                                      <td className="py-2.5 px-3 font-bold text-slate-900">
                                        <div className="flex items-center gap-1.5">
                                          <span>{agent.name}</span>
                                          {agent.is_new && (
                                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              NEW
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                        {agent.model || "—"}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            (agent.risk_score ?? 0) >= 70
                                              ? "bg-rose-50 text-rose-700"
                                              : (agent.risk_score ?? 0) >= 40
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-emerald-50 text-emerald-700"
                                          }`}
                                        >
                                          Score: {agent.risk_score ?? "—"}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <button
                                          onClick={() => {
                                            handleCloseDetail();
                                            navigate(`/agents/${agent.id}`);
                                          }}
                                          className="text-blue-600 font-semibold hover:underline text-[11px]"
                                        >
                                          Inspect Agent
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* Models Discovered in this Scan */}
                  {scanDetail?.models &&
                    scanDetail.models.length > 0 &&
                    (() => {
                      const totalModelsInScan = scanDetail.models.length;
                      const newModelsInScan = scanDetail.models.filter(
                        (m) => m.is_new,
                      ).length;
                      const displayedModels =
                        modalModelFilter === "new"
                          ? scanDetail.models.filter((m) => m.is_new)
                          : scanDetail.models;

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <Box size={14} className="text-amber-600" />
                                Models Identified ({totalModelsInScan})
                              </h3>
                              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setModalModelFilter("all")}
                                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                    modalModelFilter === "all"
                                      ? "bg-white text-slate-900 shadow-xs"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  All ({totalModelsInScan})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModalModelFilter("new")}
                                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                                    modalModelFilter === "new"
                                      ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                                      : "text-slate-500 hover:text-emerald-700"
                                  }`}
                                >
                                  <span>Newly Introduced</span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                                    {newModelsInScan}
                                  </span>
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                handleCloseDetail();
                                navigate("/models");
                              }}
                              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View in Models
                              <ExternalLink size={11} />
                            </button>
                          </div>

                          {displayedModels.length === 0 ? (
                            <div className="border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 bg-slate-50/50">
                              No net-new foundation models were introduced in
                              this scan (all {totalModelsInScan} were already
                              known).
                            </div>
                          ) : (
                            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#F8FAFC] border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                                  <tr>
                                    <th className="py-2.5 px-3">Model Name</th>
                                    <th className="py-2.5 px-3">Provider</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3 text-right">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {displayedModels.map((model) => (
                                    <tr
                                      key={model.id}
                                      className="hover:bg-slate-50/70"
                                    >
                                      <td className="py-2.5 px-3 font-bold text-slate-900">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-[11.5px]">
                                            {model.name}
                                          </span>
                                          {model.is_new && (
                                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              NEW
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 capitalize">
                                        {model.provider || "—"}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 uppercase text-[10px] font-semibold">
                                        {model.model_type || "LLM"}
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <button
                                          onClick={() => {
                                            handleCloseDetail();
                                            navigate("/models");
                                          }}
                                          className="text-blue-600 font-semibold hover:underline text-[11px]"
                                        >
                                          Inspect Model
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-[#F8FAFC] flex items-center justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
