import { useNavigate } from "react-router-dom";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["topModels"];
}

export default function TopModelsCard({ data }: Props) {
  const navigate = useNavigate();

  const getProviderBadge = (provider: string, modelName: string) => {
    const p = provider.toLowerCase();
    const m = modelName.toLowerCase();
    if (p.includes("anthropic") || m.includes("claude")) {
      return (
        <span className="w-5 h-5 rounded flex items-center justify-center bg-amber-50 text-amber-600 font-bold text-[10px] shrink-0 border border-amber-200/80">
          A
        </span>
      );
    }
    if (p.includes("openai") || m.includes("gpt")) {
      return (
        <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-[10px] shrink-0 border border-emerald-200/80">
          O
        </span>
      );
    }
    if (p.includes("google") || m.includes("gemini")) {
      return (
        <span className="w-5 h-5 rounded flex items-center justify-center bg-sky-50 text-sky-600 font-bold text-[10px] shrink-0 border border-sky-200/80">
          G
        </span>
      );
    }
    if (p.includes("aws") || m.includes("aws")) {
      return (
        <span className="w-5 h-5 rounded flex items-center justify-center bg-orange-50 text-orange-600 font-bold text-[10px] shrink-0 border border-orange-200/80">
          W
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-[10px] shrink-0 border border-slate-200">
        AI
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Top Models by Risk
        </h3>
        <button
          onClick={() => navigate("/models")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          View all &rarr;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[11px]">
              <th className="pb-2 font-medium">Model</th>
              <th className="pb-2 font-medium text-center">Agents</th>
              <th className="pb-2 font-medium text-right">Avg. Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const isHigh = item.riskLevel === "High";
              const isMed = item.riskLevel === "Medium";
              return (
                <tr
                  key={item.modelName}
                  onClick={() => navigate("/models")}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {getProviderBadge(item.provider, item.modelName)}
                      <span className="font-semibold text-slate-800 text-[12px] truncate max-w-[150px]">
                        {item.modelName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-mono font-bold text-slate-700 text-[12px]">
                    {item.agentCount}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHigh
                          ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                          : isMed
                          ? "bg-amber-50 text-amber-600 border border-amber-200/80"
                          : "bg-blue-50 text-blue-600 border border-blue-200/80"
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
