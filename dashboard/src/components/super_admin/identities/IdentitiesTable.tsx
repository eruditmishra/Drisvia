import { ArrowDown, ArrowUp, MoreVertical, Shield, ExternalLink, IdCard, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { DiscoveredAgent } from "../../../types/discovery";
import { formatStatus } from "../../../pages/super-admin/DiscoveredModels";
import { getAgentStatusStyle } from "../../../lib/agentStatus";

interface IdentitiesTableProps {
  agents: DiscoveredAgent[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onOpenUpdateModal?: (agent: DiscoveredAgent) => void;
}

export default function IdentitiesTable({
  agents,
  sortBy,
  sortOrder,
  onSort,
  onOpenUpdateModal,
}: IdentitiesTableProps) {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-brand inline" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-brand inline" />
    );
  };

  const SortableHeader = ({
    field,
    label,
    align = "left",
  }: {
    field: string;
    label: string;
    align?: "left" | "right";
  }) => (
    <th
      onClick={() => onSort(field)}
      className={`pb-3 px-3 first:pl-0 cursor-pointer hover:text-text-primary transition-colors select-none whitespace-nowrap ${
        align === "right" ? "text-right pr-4" : "text-left"
      }`}
    >
      <div
        className={`flex items-center ${align === "right" ? "justify-end" : ""}`}
      >
        {label} <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="bg-glass-white backdrop-blur-glass border border-glass-border rounded-t-r16 shadow-glass p-5 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-glass-border-dim text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <SortableHeader field="name" label="Identity Name" />
              <th className="pb-3 px-3 text-left">Identity Type</th>
              <SortableHeader field="cloud_provider" label="Provider" />
              <th className="pb-3 px-3 text-left">Environment</th>
              <SortableHeader
                field="risk_score"
                label="Risk Score"
                align="right"
              />
              <SortableHeader field="created_at" label="Discovered At" />
              <SortableHeader field="status" label="Status" />
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-text-primary">
            {agents.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-text-muted text-[13px]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <IdCard size={32} className="text-slate-300 stroke-[1.5]" />
                    <span className="font-semibold text-slate-600">
                      No agent identities found matching your criteria
                    </span>
                    <span className="text-xs text-slate-400">
                      Entra Agent IDs and Service Principals will appear here after discovery scans.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              agents.map((agent) => {
                const objectId =
                  agent.metadata?.objectId ||
                  agent.metadata?.deep?.agentId ||
                  (agent.fingerprint?.includes(":")
                    ? agent.fingerprint.split(":").pop()
                    : null);
                const environment =
                  agent.metadata?.environment ||
                  (agent.region ? agent.region.toUpperCase() : "Global");

                return (
                  <tr
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="border-b border-glass-border-dim last:border-0 hover:bg-white/40 transition-colors cursor-pointer group"
                  >
                    {/* Identity Name + Object ID */}
                    <td className="py-3 px-3 first:pl-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100/70 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <IdCard size={15} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[280px]">
                            {agent.name || "Unnamed Identity"}
                          </span>
                          {objectId && (
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[240px]">
                              ID: {objectId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Identity Type */}
                    <td className="py-3 px-3 text-[12px]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <Shield size={11} className="text-purple-500" />
                        {agent.provider === "entra_agent_id"
                          ? "Entra Agent ID"
                          : agent.deployment_type || "Service Principal"}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        Azure Entra ID
                      </span>
                    </td>

                    {/* Environment / Region */}
                    <td className="py-3 px-3 text-text-secondary text-[12px]">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize font-medium text-slate-700">
                          {environment}
                        </span>
                        {agent.region && (
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({agent.region})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-3 text-right pr-4 font-display">
                      {agent.riskScoreBreakdown ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span
                            className={`text-[13px] font-bold ${
                              agent.riskScoreBreakdown.riskLevel === "Critical"
                                ? "text-red-700"
                                : agent.riskScoreBreakdown.riskLevel === "High"
                                  ? "text-orange-700"
                                  : agent.riskScoreBreakdown.riskLevel === "Medium"
                                    ? "text-amber-800"
                                    : "text-emerald-800"
                            }`}
                          >
                            {agent.riskScoreBreakdown.finalScore}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border shadow-xs ${
                              agent.riskScoreBreakdown.riskLevel === "Critical"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : agent.riskScoreBreakdown.riskLevel === "High"
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : agent.riskScoreBreakdown.riskLevel === "Medium"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {agent.riskScoreBreakdown.riskLevel}
                          </span>
                        </div>
                      ) : agent.risk_score != null ? (
                        <span className="text-[13px] font-bold text-slate-800">
                          {agent.risk_score}
                        </span>
                      ) : (
                        <span className="text-text-muted text-[12px]">—</span>
                      )}
                    </td>

                    {/* Discovered At */}
                    <td className="py-3 px-3 text-text-secondary text-[12px] whitespace-nowrap">
                      {agent.created_at
                        ? new Date(agent.created_at).toLocaleString()
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getAgentStatusStyle(
                          agent.status,
                        )}`}
                      >
                        {formatStatus(agent.status)}
                      </span>
                    </td>

                    {/* Actions menu */}
                    <td
                      className="py-3 text-right pr-4 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(
                            activeDropdown === agent.id ? null : agent.id,
                          );
                        }}
                        className="p-1 rounded hover:bg-slate-200/60 transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeDropdown === agent.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setActiveDropdown(null);
                                navigate(`/agents/${agent.id}`);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <ExternalLink size={13} className="text-slate-400" />
                              <span>View Profile</span>
                            </button>
                            {onOpenUpdateModal && (
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  onOpenUpdateModal(agent);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 size={13} className="text-blue-500" />
                                <span>Change Status</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
