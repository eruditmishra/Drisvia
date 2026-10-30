import { useNavigate } from "react-router-dom";
import {
  Info,
  Bot,
  Target,
  MessageSquare,
  GitFork,
  Package,
  UserCheck,
  Eye,
} from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["owaspFramework"];
}

const iconMap: Record<string, any> = {
  Bot,
  Target,
  MessageSquare,
  GitFork,
  Package,
  UserCheck,
  Eye,
};

export default function OwaspFrameworkCard({ data }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col min-h-[415px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Agentic AI Risk Framework (OWASP)
          </h3>
          <Info size={13} className="text-slate-400 cursor-help" />
        </div>
        <button
          onClick={() => navigate("/assessments")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          View all &rarr;
        </button>
      </div>

      <div className="flex-1 w-full">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[11px]">
              <th className="pb-2 font-medium">Risk Category</th>
              <th className="pb-2 font-medium text-right">Affected Agents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const Icon = iconMap[item.icon] || Bot;
              return (
                <tr
                  key={item.code}
                  onClick={() => navigate("/assessments")}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-50 text-indigo-500 shrink-0">
                        <Icon size={12} />
                      </div>
                      <span className="font-semibold text-slate-800 text-[12px] truncate max-w-[220px]" title={item.category}>
                        {item.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-slate-700 text-[12px] pr-1">
                    {item.affectedAgents}
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
