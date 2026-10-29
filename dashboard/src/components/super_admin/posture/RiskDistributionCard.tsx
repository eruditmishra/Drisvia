import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["riskDistribution"];
}

export default function RiskDistributionCard({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Risk Distribution
        </h3>
      </div>

      <div className="flex-1 flex items-end justify-between gap-6 px-3 pb-2 pt-4">
        {data.map((item) => {
          // Dynamic height from 20% to 85%
          const heightPct = Math.max(14, Math.round((item.count / maxCount) * 82));
          return (
            <div key={item.level} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Value on top of the bar */}
              <span className="text-xs font-bold text-slate-700 mb-1.5 transition-transform group-hover:-translate-y-0.5">
                {item.count}
              </span>
              
              {/* Bar */}
              <div className="w-full max-w-[48px] bg-slate-100 rounded-t-md overflow-hidden flex items-end h-[140px]">
                <div
                  className="w-full rounded-t-md transition-all duration-700 ease-out group-hover:brightness-95"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              {/* Label below */}
              <span className="text-[11px] font-semibold text-slate-500 mt-2">
                {item.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
