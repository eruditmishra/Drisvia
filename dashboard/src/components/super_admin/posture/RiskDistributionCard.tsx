import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["riskDistribution"];
}

export default function RiskDistributionCard({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[250px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Risk Distribution
        </h3>
      </div>

      <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-1">
        {data.map((item) => {
          const heightPct =
            item.count > 0
              ? Math.max(12, Math.round((item.count / maxCount) * 100))
              : 0;

          return (
            <div key={item.level} className="flex-1 flex flex-col items-center justify-end group">
              {/* Value on top of the bar */}
              <span className="text-[12px] font-bold text-slate-700 mb-1 transition-transform group-hover:-translate-y-0.5">
                {item.count}
              </span>
              
              {/* Bar track */}
              <div className="w-full max-w-[44px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-[110px]">
                {item.count > 0 ? (
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-95"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                ) : (
                  <div className="w-full h-1 bg-slate-200 rounded-full" />
                )}
              </div>

              {/* Label below */}
              <span className="text-[11px] font-semibold text-slate-600 mt-2">
                {item.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
