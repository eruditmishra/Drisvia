import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["environments"];
  onSelectEnvironment?: (provider: string) => void;
}

export default function EnvironmentsCard({ data, onSelectEnvironment }: Props) {
  const chartData = data.segments.map((seg) => ({
    name: seg.provider,
    value: seg.count,
    color: seg.color,
    percentage: seg.percentage,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col min-h-[295px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Environments
        </h3>
      </div>

      <div className="flex-1 flex items-center justify-between gap-3 min-h-0">
        {/* Donut Chart with Center Text */}
        <div className="relative w-[120px] h-[120px] shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xl font-extrabold text-slate-900 leading-none">
              {data.totalAgents}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              Total Agents
            </span>
          </div>
        </div>

        {/* Legend on Right */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0 pl-1">
          {data.segments.map((seg) => (
            <div
              key={seg.provider}
              onClick={() => onSelectEnvironment?.(seg.provider)}
              className="flex items-center justify-between text-xs hover:bg-slate-50 px-1.5 py-1 rounded-md transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span
                  className="text-[12px] font-medium text-slate-700 truncate group-hover:text-slate-900"
                  title={seg.provider}
                >
                  {seg.provider}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 font-mono shrink-0 whitespace-nowrap ml-1">
                {seg.count}{" "}
                <span className="text-slate-400 font-normal">({seg.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
