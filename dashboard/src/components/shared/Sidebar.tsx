import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Bot,
  List,
  Ghost,
  ShieldCheck,
  Box,
  Radar,
  History,
  FileCheck,
  Share2,
  Fingerprint,
  UserCheck,
  KeyRound,
  RefreshCw,
  FileText,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export default function Sidebar() {
  const location = useLocation();

  // ── Permissions ──
  const canViewDashboard = usePermission("dashboard", "view");
  const canViewAgents = usePermission("agents", "view");
  const canViewShadowAgents = usePermission("shadow_agents", "view");
  const canViewVerifiedAgents = usePermission("verified_agents", "view");
  const canViewModels = usePermission("models", "view");
  const canViewScans =
    usePermission("auto_discovery_config", "view") ||
    usePermission("scanning", "view") ||
    usePermission("discovery_results", "view");
  const canViewCompliance = usePermission("assessments", "view");
  const canViewIntegrations = usePermission("integrations", "view");
  const canViewUsers = usePermission("user_management", "view");
  const canViewSso = usePermission("sso_config", "view");
  const canViewAutoDiscovery = usePermission("auto_discovery_config", "view");
  const canViewAuditLogs = usePermission("agent_audit_logs", "view");

  const canViewAnyAgents =
    canViewAgents || canViewShadowAgents || canViewVerifiedAgents;
  const canViewIam = canViewUsers || canViewSso;

  // ── Accordion State: sub-options toggle on clicking main option ──
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
    agents: location.pathname.startsWith("/agents"),
    scans:
      location.pathname.startsWith("/scans") ||
      location.pathname.startsWith("/auto-discovery"),
    iam:
      location.pathname.startsWith("/user-management") ||
      location.pathname.startsWith("/sso"),
  }));

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ── Styling Classes ──
  const activeClass = "bg-[#EAF2FF] text-[#2563EB] font-bold shadow-xs";
  const inactiveClass =
    "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium";

  const directNavClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 ${
      isActive ? activeClass : inactiveClass
    }`;

  const parentButtonClass = (isChildActive: boolean, isOpen: boolean) =>
    `flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 cursor-pointer ${
      isChildActive && !isOpen
        ? "bg-[#EAF2FF]/70 text-[#2563EB] font-semibold"
        : isChildActive
        ? "text-[#2563EB] font-semibold"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
    }`;

  const subNavClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150 group ${
      isActive
        ? "bg-[#EAF2FF] text-[#2563EB] font-bold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 font-medium"
    }`;

  // ── Active group indicators ──
  const isAgentsActive = location.pathname.startsWith("/agents");
  const isScansActive =
    location.pathname.startsWith("/scans") ||
    location.pathname.startsWith("/auto-discovery");
  const isIamActive =
    location.pathname.startsWith("/user-management") ||
    location.pathname.startsWith("/sso");

  return (
    <aside className="w-[230px] min-w-[230px] h-screen flex flex-col bg-[#F2F9FD] relative z-10 shrink-0 select-none">
      {/* ── Brand Logo Header ── */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-[32px] h-[32px] rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm text-white">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="font-extrabold text-[17px] text-slate-900 tracking-tight leading-none">
            Drisvia
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
            AI Agent Discovery & Governance
          </div>
        </div>
      </div>

      {/* ── Main Navigation List ── */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-2 flex flex-col gap-1 custom-scrollbar">
        {/* 1. Dashboard */}
        {canViewDashboard && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => directNavClass(isActive)}
          >
            <LayoutGrid size={18} className="shrink-0" />
            <span>Dashboard</span>
          </NavLink>
        )}

        {/* 2. Agents (Expandable -> All Agents, Shadow Agents, Verified Agents) */}
        {canViewAnyAgents && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleMenu("agents")}
              className={parentButtonClass(isAgentsActive, openMenus.agents)}
            >
              <div className="flex items-center gap-3">
                <Bot size={18} className="shrink-0" />
                <span>Agents</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  openMenus.agents ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenus.agents && (
              <div className="flex flex-col gap-0.5 pl-4 pr-1 py-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {canViewAgents && (
                  <NavLink
                    to="/agents"
                    end
                    className={({ isActive }) => subNavClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <List
                          size={14}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#2563EB]"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span>All Agents</span>
                      </>
                    )}
                  </NavLink>
                )}

                {canViewShadowAgents && (
                  <NavLink
                    to="/agents/shadow"
                    className={({ isActive }) => subNavClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <Ghost
                          size={14}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#2563EB]"
                              : "text-amber-500/80 group-hover:text-amber-600"
                          }`}
                        />
                        <span>Shadow Agents</span>
                      </>
                    )}
                  </NavLink>
                )}

                {canViewVerifiedAgents && (
                  <NavLink
                    to="/agents/verified"
                    className={({ isActive }) => subNavClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <ShieldCheck
                          size={14}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#2563EB]"
                              : "text-emerald-500/80 group-hover:text-emerald-600"
                          }`}
                        />
                        <span>Verified Agents</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Models */}
        {canViewModels && (
          <NavLink
            to="/models"
            className={({ isActive }) => directNavClass(isActive)}
          >
            <Box size={18} className="shrink-0" />
            <span>Models</span>
          </NavLink>
        )}

        {/* 4. Scans (Expandable -> Scan History, Auto Scans) */}
        {canViewScans && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleMenu("scans")}
              className={parentButtonClass(isScansActive, openMenus.scans)}
            >
              <div className="flex items-center gap-3">
                <Radar size={18} className="shrink-0" />
                <span>Scans</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  openMenus.scans ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenus.scans && (
              <div className="flex flex-col gap-0.5 pl-4 pr-1 py-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <NavLink
                  to="/scans"
                  end
                  className={({ isActive }) => subNavClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <History
                        size={14}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? "text-[#2563EB]"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span>Scan History</span>
                    </>
                  )}
                </NavLink>

                {canViewAutoDiscovery && (
                  <NavLink
                    to="/auto-discovery"
                    className={({ isActive }) => subNavClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <RefreshCw
                          size={14}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#2563EB]"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span>Auto Scans</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. Compliance */}
        {canViewCompliance && (
          <NavLink
            to="/assessments"
            className={({ isActive }) =>
              directNavClass(
                isActive ||
                  location.pathname.startsWith("/assessments") ||
                  location.pathname.startsWith("/compliance")
              )
            }
          >
            <FileCheck size={18} className="shrink-0" />
            <span>Compliance</span>
          </NavLink>
        )}

        {/* 6. Integrations */}
        {canViewIntegrations && (
          <NavLink
            to="/integrations"
            className={({ isActive }) => directNavClass(isActive)}
          >
            <Share2 size={18} className="shrink-0" />
            <span>Integrations</span>
          </NavLink>
        )}

        {/* 7. IAM (Expandable -> Users, SSO Integration) */}
        {canViewIam && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleMenu("iam")}
              className={parentButtonClass(isIamActive, openMenus.iam)}
            >
              <div className="flex items-center gap-3">
                <Fingerprint size={18} className="shrink-0" />
                <span>IAM</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  openMenus.iam ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenus.iam && (
              <div className="flex flex-col gap-0.5 pl-4 pr-1 py-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {canViewUsers && (
                  <NavLink
                    to="/user-management"
                    className={({ isActive }) => subNavClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <UserCheck
                          size={14}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#2563EB]"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span>Users</span>
                      </>
                    )}
                  </NavLink>
                )}

                {canViewSso && (
                  <NavLink
                    to="/sso"
                    className={({ isActive }) => subNavClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <KeyRound
                          size={14}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#2563EB]"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span>SSO Integration</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* 8. Audit Logs */}
        {canViewAuditLogs && (
          <NavLink
            to="/audit-logs"
            className={({ isActive }) => directNavClass(isActive)}
          >
            <FileText size={18} className="shrink-0" />
            <span>Audit Logs</span>
          </NavLink>
        )}
      </nav>

      {/* ── Bottom Upgrade Plan Callout ── */}
      <div className="p-3.5 mt-auto">
        <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
          <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
            Secure your AI estate from discovery to governance.
          </p>
          <button
            onClick={() => window.open("https://drisvia.com/pricing", "_blank")}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <span>Upgrade Plan</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
