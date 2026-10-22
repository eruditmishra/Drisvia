import { NavLink } from "react-router-dom";
import {
  Activity,
  Globe,
  Cpu,
  Link as LinkIcon,
  Shield,
  ShieldCheck,
  Users,
  Search,
  FileText,
  Fingerprint,
} from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export default function Sidebar() {
  // const user = useStore((s) => s.user);
  // const roleLabel = useRoleDisplayName();

  // ── Permission checks ────────────────────────────────────────────────────
  const canViewDashboard = usePermission("dashboard", "view");
  const canViewAgents = usePermission("agents", "view");
  const canViewModels = usePermission("models", "view");
  const canViewIntegrations = usePermission("integrations", "view");
  const canViewSsoConfig = usePermission("sso_config", "view");
  const canViewAutoDiscovery = usePermission("auto_discovery_config", "view");
  const canViewAgentAuditLogs = usePermission("agent_audit_logs", "view");
  const canViewUserManagement = usePermission("user_management", "view");
  const canViewAssessments = usePermission("assessments", "view");

  const activeClass =
    "bg-[#2563EB] text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] translate-x-1 font-bold";
  const inactiveClass =
    "text-[#A5BBD9] hover:bg-white/[0.08] hover:text-white border border-transparent";
  const navClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-r10 text-[13px] font-bold transition-all duration-200 ${isActive ? activeClass : inactiveClass}`;

  const subActiveClass =
    "text-white bg-[#2563EB]/25 border-l-2 border-[#2563EB] -ml-[2px] font-bold";
  const subInactiveClass =
    "text-[#8FA8D6] hover:text-white hover:bg-white/[0.05] border-l-2 border-transparent -ml-[2px]";
  const subNavClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ${isActive ? subActiveClass : subInactiveClass}`;

  return (
    <aside className="w-[248px] min-w-[248px] h-screen flex flex-col border-r border-[#152347] shadow-[4px_0_24px_rgba(12,23,49,0.18)] relative z-10 shrink-0 bg-[#0C1731]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-[#1A2C54]">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-white flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="/apnto-white-bg.png"
              alt="Apnto"
              className="w-[22px] h-[22px] object-contain"
            />
          </div>
          <div>
            <div className="font-display text-[16px] font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Drisvia
              <span className="text-[9px] bg-[#2563EB]/40 text-blue-200 border border-[#2563EB]/60 px-1.5 py-0.2 rounded-full font-semibold">
                AI
              </span>
            </div>
            <div className="text-[10px] text-[#8FA8D6] font-medium mt-[1px]">
              Governance Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 sidebar-navigation">
        {/* Overview */}
        {canViewDashboard && (
          <div>
            <div className="text-[10px] font-extrabold text-[#6B86B8] tracking-widest uppercase mb-2 ml-2">
              Overview
            </div>

            <NavLink
              to="/dashboard"
              className={({ isActive }) => navClass(isActive)}
            >
              <Activity size={16} />
              Dashboard
            </NavLink>
          </div>
        )}

        {/* Discovery */}
        {canViewAgents && (
          <div>
            <div className="text-[10px] font-extrabold text-[#6B86B8] tracking-widest uppercase mb-2 ml-2">
              Discovery
            </div>

            <div className="flex flex-col mb-1">
              <div className="flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-[#D0E0F8] select-none">
                <Globe size={16} className="text-[#8FA8D6]" />
                Discovered Agents
              </div>

              <div className="flex flex-col ml-7 mt-1 border-l border-[#1A2C54] gap-1">
                <NavLink
                  to="/agents"
                  end
                  className={({ isActive }) => subNavClass(isActive)}
                >
                  All Agents
                </NavLink>
                <NavLink
                  to="/agents/shadow"
                  className={({ isActive }) => subNavClass(isActive)}
                >
                  Shadow Agents
                </NavLink>
                <NavLink
                  to="/agents/verified"
                  className={({ isActive }) => subNavClass(isActive)}
                >
                  Verified Agents
                </NavLink>
                <NavLink
                  to="/identities"
                  className={({ isActive }) => subNavClass(isActive)}
                >
                  <Fingerprint size={12} className="shrink-0" />
                  Identities
                </NavLink>
              </div>
            </div>

            {canViewModels && (
              <NavLink
                to="/models"
                className={({ isActive }) => navClass(isActive)}
              >
                <Cpu size={16} />
                Discovered Models
              </NavLink>
            )}

            {canViewAutoDiscovery && (
              <NavLink
                to="/auto-discovery"
                className={({ isActive }) => `${navClass(isActive)} mt-1`}
              >
                <Search size={16} />
                Auto Discovery
              </NavLink>
            )}
          </div>
        )}

        {/* Governance & Compliance */}
        {canViewAssessments && (
          <div>
            <div className="text-[10px] font-extrabold text-[#6B86B8] tracking-widest uppercase mb-2 ml-2">
              Governance &amp; Compliance
            </div>
            <NavLink
              to="/assessments"
              className={({ isActive }) => navClass(isActive)}
            >
              <ShieldCheck size={16} />
              Assessments
            </NavLink>
          </div>
        )}

        {/* Administration */}
        {(canViewIntegrations || canViewSsoConfig || canViewUserManagement) && (
          <div>
            <div className="text-[10px] font-extrabold text-[#6B86B8] tracking-widest uppercase mb-2 ml-2">
              Administration
            </div>

            {canViewIntegrations && (
              <NavLink
                to="/integrations"
                className={({ isActive }) => navClass(isActive)}
              >
                <LinkIcon size={16} />
                Integrations
              </NavLink>
            )}

            {canViewSsoConfig && (
              <NavLink
                to="/sso"
                className={({ isActive }) => `${navClass(isActive)} mt-1`}
              >
                <Shield size={16} />
                SSO Integration
              </NavLink>
            )}

            {canViewUserManagement && (
              <NavLink
                to="/user-management"
                className={({ isActive }) => `${navClass(isActive)} mt-1`}
              >
                <Users size={16} />
                User & IAM
              </NavLink>
            )}
          </div>
        )}

        {/* Audit & Monitoring */}
        {canViewAgentAuditLogs && (
          <div>
            <div className="text-[10px] font-extrabold text-[#6B86B8] tracking-widest uppercase mb-2 ml-2">
              Audit &amp; Monitoring
            </div>

            {canViewAgentAuditLogs && (
              <NavLink
                to="/audit-logs"
                className={({ isActive }) => navClass(isActive)}
              >
                <FileText size={16} />
                Audit Logs
              </NavLink>
            )}
          </div>
        )}
      </div>

      {/* Platform Status Footer */}
      {/* <div className="p-3 border-t border-[#152347] bg-[#0A1329]/80">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#111F42]/80 border border-[#1A2C54]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-[#A5BBD9]">Posture Live</span>
          </div>
          <span className="text-[10px] font-bold text-[#2563EB] bg-[#EAF2FF] px-1.5 py-0.5 rounded shadow-sm">Enterprise</span>
        </div>
      </div> */}
    </aside>
  );
}
