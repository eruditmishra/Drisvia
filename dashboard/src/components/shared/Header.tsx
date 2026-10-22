import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  User,
  LogOut,
  Radar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import useStore from "../../store/useStore";
import { discoveryAPI } from "../../lib/api";

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

export default function Header() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const location = useLocation();
  const isDashboard =
    location.pathname === "/" || location.pathname === "/dashboard";
  const greetingInfo = getGreetingInfo();
  const firstName = getFirstName(user?.name);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Scan State ─────────────────────────────────────────────────────────────
  const [scanStatus, setScanStatus] = useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
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

      if (!scanId) {
        throw new Error("No scan ID returned");
      }

      // Progress animation & Polling
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
              setStatusMessage(
                `Scan completed: ${found} agent${found === 1 ? "" : "s"} discovered`,
              );
              window.dispatchEvent(
                new CustomEvent("drisvia:scan-completed", { detail: scan }),
              );
              setTimeout(() => setScanStatus("idle"), 7000);
            } else {
              setScanStatus("error");
              setStatusMessage(scan.error || "Scan failed");
              setTimeout(() => setScanStatus("idle"), 6000);
            }
          } else {
            currentProgress = Math.min(
              currentProgress + Math.floor(Math.random() * 12 + 8),
              90,
            );
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
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Scan failed to start";
      if (msg.toLowerCase().includes("no active integrations")) {
        setStatusMessage(
          "No active integrations configured. Connect a provider first.",
        );
      } else {
        setStatusMessage(msg);
      }
      setTimeout(() => setScanStatus("idle"), 6000);
    }
  };

  return (
    <header
      className={`bg-transparent flex ${
        isDashboard
          ? "flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 pb-2"
          : "items-center justify-end py-3"
      } px-6 relative z-20 shrink-0`}
    >
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

      {/* Left side: Greeting on Dashboard */}
      {isDashboard ? (
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-[#1D2329]">
            {greetingInfo.greeting}, {firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {greetingInfo.subMessage}
          </p>
        </div>
      ) : (
        <div />
      )}

      {/* Right side: Scan Button + Scan Progress Status Bar + User menu */}
      <div className="flex items-center gap-3">
        {/* Status Bar Notification */}
        {scanStatus === "running" && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#EAF2FF] border border-[#C8DCFE] text-[#2563EB] text-xs font-semibold shadow-sm animate-in fade-in duration-200">
            <RefreshCw size={13} className="animate-spin text-[#2563EB]" />
            <span>Scanning all integrations...</span>
            <span className="font-mono font-bold bg-white text-[#2563EB] px-1.5 py-0.5 rounded text-[10px] border border-[#C8DCFE]">
              {Math.round(progress)}%
            </span>
          </div>
        )}

        {scanStatus === "completed" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>{statusMessage}</span>
          </div>
        )}

        {scanStatus === "error" && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-sm animate-in fade-in duration-200 max-w-sm truncate"
            title={statusMessage}
          >
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        {/* Run Scan Button */}
        <button
          onClick={handleRunScan}
          disabled={scanStatus === "running"}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-bold shadow-sm shadow-[#2563EB]/25 hover:shadow-md hover:shadow-[#2563EB]/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Trigger full discovery scan across all integrations"
        >
          <Radar
            size={14}
            className={scanStatus === "running" ? "animate-spin" : ""}
          />
          <span>{scanStatus === "running" ? "Scanning..." : "Run Scan"}</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-[#DCE7F9]" />

        {/* User profile button & minimal dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-menu-btn"
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#1D2329] hover:bg-slate-100/70 transition-all cursor-pointer select-none"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <User size={16} className="text-slate-500" />
            <span className="text-[13px] font-medium text-[#1D2329]">
              {user?.name || "Admin"}
            </span>
          </button>

          {dropdownOpen && (
            <div
              id="user-dropdown-menu"
              className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg shadow-black/5 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3.5 py-2.5 border-b border-[#F1F5F9]">
                <p
                  className="text-xs font-semibold text-[#1D2329] truncate"
                  title={user?.email || "admin@drisvia.local"}
                >
                  {user?.email || "admin@drisvia.local"}
                </p>
                <p className="text-[11px] text-slate-500 font-medium capitalize mt-0.5">
                  {user?.role ? user.role.replace(/_/g, " ") : "Super Admin"}
                </p>
              </div>

              <div className="p-1">
                <button
                  id="logout-btn"
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
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
