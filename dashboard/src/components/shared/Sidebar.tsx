import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Bot,
  ShieldAlert,
  Share2,
  ShieldCheck,
  FileText,
  Settings,
  ArrowRight,
} from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export default function Sidebar() {
  const canViewDashboard = usePermission("dashboard", "view");
  const canViewAgents = usePermission("agents", "view");
  const canViewIntegrations = usePermission("integrations", "view");
  const canViewAssessments = usePermission("assessments", "view");
  const canViewAuditLogs = usePermission("agent_audit_logs", "view");
  const canViewSettings = usePermission("sso_config", "view") || usePermission("user_management", "view") || usePermission("auto_discovery_config", "view");

  const activeClass =
    "bg-[#EAF2FF] text-[#2563EB] font-bold shadow-xs";
  const inactiveClass =
    "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium";

  const navClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 ${
      isActive ? activeClass : inactiveClass
    }`;

  return (
    <aside className="w-[230px] min-w-[230px] h-screen flex flex-col border-r border-slate-200/90 bg-white relative z-10 shrink-0 select-none">
      {/* ── Brand Logo Header ── */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-[32px] h-[32px] rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm text-white">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <nav className="flex-1 overflow-y-auto px-3.5 py-2 flex flex-col gap-1.5 custom-scrollbar">
        {canViewDashboard && (
          <NavLink to="/dashboard" className={({ isActive }) => navClass(isActive)}>
            <LayoutGrid size={18} className="shrink-0" />
            <span>Dashboard</span>
          </NavLink>
        )}

        {canViewAgents && (
          <NavLink to="/agents" className={({ isActive }) => navClass(isActive)}>
            <Bot size={18} className="shrink-0" />
            <span>Agents</span>
          </NavLink>
        )}

        <NavLink to="/agents?filter=risks" className={({ isActive }) => navClass(isActive)}>
          <ShieldAlert size={18} className="shrink-0" />
          <span>Risks & Findings</span>
        </NavLink>

        {canViewIntegrations && (
          <NavLink to="/integrations" className={({ isActive }) => navClass(isActive)}>
            <Share2 size={18} className="shrink-0" />
            <span>Integrations</span>
          </NavLink>
        )}

        {canViewAssessments && (
          <NavLink to="/assessments" className={({ isActive }) => navClass(isActive)}>
            <ShieldCheck size={18} className="shrink-0" />
            <span>Compliance</span>
          </NavLink>
        )}

        {canViewAuditLogs && (
          <NavLink to="/audit-logs" className={({ isActive }) => navClass(isActive)}>
            <FileText size={18} className="shrink-0" />
            <span>Reports</span>
          </NavLink>
        )}

        {canViewSettings && (
          <NavLink to="/sso" className={({ isActive }) => navClass(isActive)}>
            <Settings size={18} className="shrink-0" />
            <span>Settings</span>
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
