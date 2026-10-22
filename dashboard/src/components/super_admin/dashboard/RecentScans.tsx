import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { DashboardData } from "../../../types/dashboard";

interface RecentScansProps {
  scans: DashboardData["recentScans"];
}

export default function RecentScans({ scans }: RecentScansProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#DCE7F9] shadow-[0_2px_10px_rgba(12,23,49,0.03)] p-5 flex flex-col h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F4FC] shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text-primary text-[13px] tracking-tight">
            Recent Discovery Scans
          </h3>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {scans.length}
          </span>
        </div>
        {/* <span className="text-[11px] text-slate-400 font-medium">
          Auto-synchronized
        </span> */}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EAF2FF] text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider bg-[#F8FAFD]">
              <th className="py-2.5 pl-3 rounded-l-lg">Status</th>
              <th className="py-2.5">Timestamp</th>
              <th className="py-2.5">Scope</th>
              <th className="py-2.5">Providers</th>
              <th className="py-2.5 pr-3 text-right rounded-r-lg">
                Agents Found
              </th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-text-primary divide-y divide-[#F0F4FC]">
            {scans.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center">
                      <Clock size={18} />
                    </div>
                    <span className="text-xs font-bold text-text-primary">
                      No scans executed yet
                    </span>
                    <span className="text-[11px] text-text-muted">
                      Initiate a discovery scan to see agent findings
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              scans.map((scan, i) => (
                <tr
                  key={i}
                  className="hover:bg-[#EAF2FF]/35 transition-colors group"
                >
                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-1.5">
                      {scan.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500"
                          />
                          Done
                        </span>
                      ) : scan.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle size={12} className="text-rose-500" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] bg-[#EAF2FF] border border-[#C8DCFE] px-2 py-0.5 rounded-full">
                          <Clock
                            size={12}
                            className="text-[#2563EB] animate-spin"
                          />
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-[11px] text-text-secondary font-medium">
                    {new Date(scan.time).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 font-semibold text-text-primary capitalize">
                    {scan.type}
                  </td>

                  <td className="py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {scan.providersScanned.length === 0 ? (
                        <span className="text-[11px] text-text-muted">—</span>
                      ) : (
                        scan.providersScanned.map((p, j) => (
                          <span
                            key={j}
                            className="bg-[#EAF2FF] border border-[#C8DCFE] px-2 py-0.5 rounded text-[10px] font-bold text-[#0C1731]"
                          >
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <span className="inline-block bg-[#F4F8FD] group-hover:bg-[#EAF2FF] border border-[#DCE7F9] px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px] text-[#1D2329] transition-colors">
                      {scan.agentsFound}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
