import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  Radar,
  RefreshCw,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Bell,
} from "lucide-react";
import useStore from "../../store/useStore";
import { useDashboardFilter } from "../../store/useDashboardFilter";
import { discoveryAPI } from "../../lib/api";

export default function Header() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const {
    organization,
    setOrganization,
    period,
    setPeriod,
    environment,
    setEnvironment,
  } = useDashboardFilter();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const orgRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // ── Scan State ─────────────────────────────────────────────────────────────
  const [scanStatus, setScanStatus] = useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (orgRef.current && !orgRef.current.contains(target)) setOrgDropdownOpen(false);
      if (periodRef.current && !periodRef.current.contains(target)) setPeriodDropdownOpen(false);
      if (envRef.current && !envRef.current.contains(target)) setEnvDropdownOpen(false);
      if (userRef.current && !userRef.current.contains(target)) setUserDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRunScan = async () => {
    if (scanStatus === "running") return;

    setScanStatus("running");
    setProgress(15);
    setStatusMessage("Scanning all integrations...");

    try {
      const res = await discoveryAPI.startScan(undefined, true);
      const scanId = res.data?.scanId;

      if (!scanId) throw new Error("No scan ID returned");

      let currentProgress = 20;
      const pollInterval = setInterval(async () => {
        try {
          const checkRes = await discoveryAPI.getScan(scanId);
          const scan = checkRes.data?.scan;
          const status = scan?.status;

          if (status === "completed" || status === "failed") {
            clearInterval(pollInterval);
            if (status === "completed") {
              setProgress(100);
              setScanStatus("completed");
              const found = scan.stats?.totalAgents ?? scan.agentsFound ?? 0;
              setStatusMessage(`Scan completed: ${found} agent${found === 1 ? "" : "s"} discovered`);
              window.dispatchEvent(new CustomEvent("drisvia:scan-completed", { detail: scan }));
              setTimeout(() => setScanStatus("idle"), 6000);
            } else {
              setScanStatus("error");
              setStatusMessage(scan.error || "Scan failed");
              setTimeout(() => setScanStatus("idle"), 6000);
            }
          } else {
            currentProgress = Math.min(currentProgress + Math.floor(Math.random() * 12 + 8), 90);
            setProgress(currentProgress);
          }
        } catch (pollErr: any) {
          console.error("Failed to poll scan status", pollErr);
        }
      }, 1500);
    } catch (err: any) {
      console.error("Failed to trigger scan", err);
      setScanStatus("error");
      setProgress(0);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Scan failed";
      setStatusMessage(msg);
      setTimeout(() => setScanStatus("idle"), 6000);
    }
  };

  const periodLabels: Record<string, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
  };

  const envLabels: Record<string, string> = {
    all: "All Environments",
    aws: "AWS",
    azure: "Azure",
    gcp: "Google Cloud",
    on_prem: "On-Prem",
  };

  const displayName = user?.name || "Udit Mishra";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-[#F8FAFC] px-8 pt-5 pb-2 flex items-center justify-between relative z-20 shrink-0">
      {/* ── Scan Progress Line (Top edge) ── */}
      {scanStatus === "running" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#EAF2FF] overflow-hidden z-30">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#2563EB] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {scanStatus === "completed" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500 transition-all duration-500 z-30" />
      )}
      {scanStatus === "error" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500 transition-all duration-500 z-30" />
      )}

      {/* ── Left side: Organization Selector ── */}
      <div className="flex flex-col" ref={orgRef}>
        <span className="text-[10px] font-medium text-slate-400">
          Organization
        </span>
        <div className="relative mt-0.5">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors cursor-pointer"
          >
            <span>{organization}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {orgDropdownOpen && (
            <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {["Acme Healthcare", "Acme Financial", "Acme Global"].map((org) => (
                <button
                  key={org}
                  onClick={() => {
                    setOrganization(org);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                    organization === org ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"
                  }`}
                >
                  {org}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right side: Date Filter, Environment Filter, Notification Bell, User Avatar Pill ── */}
      <div className="flex items-center gap-3">
        {/* Scan Status notification pills if scanning */}
        {scanStatus === "running" && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold">
            <RefreshCw size={12} className="animate-spin text-blue-600" />
            <span>Scanning... {Math.round(progress)}%</span>
          </div>
        )}
        {scanStatus === "completed" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Date Filter Dropdown */}
        <div className="relative" ref={periodRef}>
          <button
            onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors cursor-pointer"
          >
            <Calendar size={13} className="text-slate-500" />
            <span>{periodLabels[period] || "Last 30 days"}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {periodDropdownOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                    period === p ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Environment Filter Dropdown */}
        <div className="relative" ref={envRef}>
          <button
            onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors cursor-pointer"
          >
            <span>{envLabels[environment] || "All Environments"}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {envDropdownOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {(["all", "aws", "azure", "gcp", "on_prem"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEnvironment(e);
                    setEnvDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                    environment === e ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"
                  }`}
                >
                  {envLabels[e]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#F8FAFC]" />
        </button>

        {/* User Profile Pill with Avatar */}
        <div className="relative ml-1" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userInitial}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                Super Admin
                <ChevronDown size={10} className="text-slate-400" />
              </span>
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || "admin@drisvia.local"}
                </p>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleRunScan();
                  }}
                  disabled={scanStatus === "running"}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Radar size={14} className="text-blue-600" />
                  <span>Run Discovery Scan</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

