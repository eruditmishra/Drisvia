import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["environments"];
  onSelectEnvironment?: (provider: string) => void;
}

function ChartTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl text-xs backdrop-blur-md border border-slate-700/60 pointer-events-none z-50 flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-slate-100 text-[11.5px] truncate">{item.name}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium pt-1 border-t border-slate-800">
          <span>{item.value} agent{item.value !== 1 ? "s" : ""}</span>
          <span className="font-bold text-white ml-2">({item.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
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
              <Tooltip content={<ChartTooltip />} wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }} />
              <Pie
                data={chartData}
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  />
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
