import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, Clock } from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data?: PostureDashboardData["riskScoreTrend"];
  period?: string;
  onPeriodChange?: (period: "7d" | "30d" | "90d") => void;
}

export default function RiskScoreTrendCard({
  data = [],
  period = "30d",
  onPeriodChange,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const periodLabels: Record<string, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
  };

  const hasSufficientData = data && data.length >= 2;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col justify-between min-h-[295px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Risk Score Trend
        </h3>

        {/* Timeframe Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{periodLabels[period] || "Last 30 days"}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onPeriodChange?.(p);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                    period === p
                      ? "text-blue-600 font-bold bg-blue-50/50"
                      : "text-slate-700"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasSufficientData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
            <Clock size={20} className="text-slate-500" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Insufficient Historical Data
          </span>
          <p className="text-[11px] text-slate-500 max-w-[280px] leading-relaxed mt-1">
            Risk score trends require daily snapshots across at least 2 distinct dates
            within the {periodLabels[period] || "selected period"}.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Daily telemetry accumulation in progress</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                dy={6}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-md text-xs">
                        <div className="font-medium text-slate-400">
                          {payload[0].payload.date}
                        </div>
                        <div className="font-bold text-white mt-0.5">
                          Risk Score: {payload[0].value}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: "#EF4444",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#EF4444",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
