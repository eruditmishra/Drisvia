import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["riskDrivers"];
}

export default function RiskDriversCard({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Risk Drivers
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
            {/* Label */}
            <span className="w-40 font-medium text-slate-600 text-[12px] truncate">
              {item.name}
            </span>

            {/* Horizontal Bar Container */}
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-2">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Percentage */}
            <span className="w-10 text-right font-mono font-semibold text-slate-700 text-[12px]">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
