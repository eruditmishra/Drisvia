import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldAlert } from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data?: PostureDashboardData["recentViolations"];
}

export default function RecentViolationsCard({ data = [] }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col justify-between min-h-[295px]">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Recent Violations
        </h3>
        <button
          onClick={() => navigate("/agents")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          View all &rarr;
        </button>
      </div>

      {/* ── Violations List ── */}
      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
            <ShieldAlert size={20} />
          </div>
          <span className="text-xs font-semibold text-slate-700">No Active Violations</span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            All scanned AI agents comply with current governance rules.
          </span>
        </div>
      ) : (
        <div className="flex flex-col justify-between flex-1 divide-y divide-slate-100 pt-1">
          {data.slice(0, 3).map((item) => {
            const isCrit = item.severity === "Critical";
            const isHigh = item.severity === "High";
            const isMed = item.severity === "Medium";

            // Vibrant dot indicator matching severity
            const dotColor = isCrit
              ? "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
              : isHigh
              ? "bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
              : isMed
              ? "bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.15)]"
              : "bg-slate-400";

            // Severity badge styling
            const badgeStyle = isCrit
              ? "bg-rose-50 text-rose-600 border-rose-200"
              : isHigh
              ? "bg-amber-50/90 text-amber-600 border-amber-200"
              : isMed
              ? "bg-sky-50 text-sky-600 border-sky-200"
              : "bg-slate-50 text-slate-600 border-slate-200";

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.agentId && item.agentId !== "agent-1" && item.agentId !== "agent-2" && item.agentId !== "agent-3") {
                    navigate(`/agents/${item.agentId}`);
                  } else {
                    navigate("/agents");
                  }
                }}
                className="py-2.5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-all duration-150"
              >
                {/* Left side: Dot + (Name & Tag on Line 1, Description on Line 2) */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="pt-1.5 shrink-0">
                    <span className={`block w-2 h-2 rounded-full ${dotColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-semibold text-slate-900 text-[12.5px] tracking-tight group-hover:text-blue-600 transition-colors truncate min-w-0"
                        title={item.agentName}
                      >
                        {item.agentName}
                      </span>
                      {item.tag && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/90 shrink-0">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px] text-slate-500 leading-normal truncate mt-0.5"
                      title={item.description}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right side: Severity Badge + Chevron */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${badgeStyle}`}
                  >
                    {item.severity}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
