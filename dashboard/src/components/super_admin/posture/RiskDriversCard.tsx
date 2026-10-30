import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["riskDrivers"];
}

export default function RiskDriversCard({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col h-[250px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Risk Drivers
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-around py-0.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2.5 text-xs">
            {/* Label */}
            <span className="w-36 font-medium text-slate-700 text-[12px] truncate shrink-0" title={item.name}>
              {item.name}
            </span>

            {/* Horizontal Bar Container */}
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden mx-1">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Percentage */}
            <span className="w-9 text-right font-mono font-bold text-slate-700 text-[11px] shrink-0">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
