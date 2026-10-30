import {
  Code,
  Lock,
  Plug,
  Database,
  Folder,
  Globe,
  Edit3,
  Link2,
} from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["capabilityExposure"];
}

const iconMap: Record<string, any> = {
  Code,
  Lock,
  Plug,
  Database,
  Folder,
  Globe,
  Edit3,
  Link2,
};

export default function CapabilityExposureCard({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Agent Capability Exposure
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[11px]">
              <th className="pb-2 font-medium">Capability</th>
              <th className="pb-2 font-medium text-center">Agents</th>
              <th className="pb-2 font-medium text-right">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const Icon = iconMap[item.icon] || Code;
              const isHigh = item.riskLevel === "High";
              return (
                <tr key={item.capabilityId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-800 text-[12px]">
                        {item.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center font-mono font-bold text-slate-700 text-[12px]">
                    {item.agentCount}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHigh
                          ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                          : "bg-amber-50 text-amber-600 border border-amber-200/80"
                      }`}
                    >
                      {item.riskLevel}
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
