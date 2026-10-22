import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { DashboardData } from "../../../types/dashboard";

interface ActiveAlertsProps {
  alerts: DashboardData["alerts"];
}

export default function ActiveAlerts({ alerts }: ActiveAlertsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-[#DCE7F9] shadow-[0_2px_10px_rgba(12,23,49,0.03)] p-5 flex flex-col h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F4FC] shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text-primary text-[13px] tracking-tight">
            Active Alerts
          </h3>
          {alerts.length > 0 ? (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              0
            </span>
          )}
        </div>
        {/* <button
          onClick={() => navigate("/agents/shadow")}
          className="text-[11px] font-medium text-slate-400 hover:text-[#2563EB] transition-colors"
        >
          View all shadow agents &rarr;
        </button> */}
      </div>

      {/* Alerts List */}
      <div className="flex flex-col divide-y divide-[#F0F4FC] overflow-y-auto flex-1 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0" />
            <span>All monitored agents are compliant. No active alerts.</span>
          </div>
        ) : (
          alerts.map((al, i) => {
            const splitIdx = al.title.indexOf(": ");
            const category =
              splitIdx !== -1 ? al.title.slice(0, splitIdx) : null;
            const entityName =
              splitIdx !== -1 ? al.title.slice(splitIdx + 2) : al.title;

            const sevDot =
              {
                critical: "bg-rose-500",
                high: "bg-amber-500",
                medium: "bg-[#2563EB]",
                low: "bg-emerald-500",
              }[al.sev] || "bg-amber-500";

            const sevBadge =
              {
                critical: "text-rose-700 bg-rose-50 border-rose-200/60",
                high: "text-amber-700 bg-amber-50 border-amber-200/60",
                medium: "text-[#2563EB] bg-[#EAF2FF] border-[#C8DCFE]",
                low: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
              }[al.sev] || "text-slate-600 bg-slate-50 border-slate-200";

            return (
              <div
                key={i}
                onClick={() => navigate("/agents/shadow")}
                className="group flex items-start justify-between gap-3 py-3 px-2 rounded-lg hover:bg-[#F8FAFD] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sevDot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#1D2329] group-hover:text-[#2563EB] transition-colors truncate">
                        {entityName}
                      </span>
                      {category && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {category}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                      {al.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${sevBadge}`}
                  >
                    {al.sev}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-slate-500 transition-colors"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
