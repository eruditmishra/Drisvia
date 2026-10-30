import { useNavigate } from "react-router-dom";
import { AlertTriangle, Slash } from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["recentEvents"];
}

export default function RecentEventsCard({ data }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[270px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Recent Security Events
        </h3>
        <button
          onClick={() => navigate("/audit-logs")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          View all &rarr;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[11px]">
              <th className="pb-2 font-medium w-24">Time</th>
              <th className="pb-2 font-medium">Event</th>
              <th className="pb-2 font-medium">Agent</th>
              <th className="pb-2 font-medium text-right">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const isCrit = item.severity === "Critical";
              const isHigh = item.severity === "High";
              const isBlock = item.title.toLowerCase().includes("unapproved");

              return (
                <tr
                  key={item.id}
                  onClick={() => navigate("/audit-logs")}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                    {item.timeAgo}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      {isBlock ? (
                        <Slash size={13} className="text-rose-500 shrink-0" />
                      ) : (
                        <AlertTriangle
                          size={13}
                          className={isCrit ? "text-rose-500 shrink-0" : "text-amber-500 shrink-0"}
                        />
                      )}
                      <span className="font-semibold text-slate-800 text-[12px] truncate max-w-[190px]" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 font-mono text-slate-600 text-[11px] truncate max-w-[140px]" title={item.agentName}>
                    {item.agentName}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCrit
                          ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                          : isHigh
                          ? "bg-amber-50 text-amber-600 border border-amber-200/80"
                          : "bg-amber-50/70 text-amber-600 border border-amber-200/60"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
