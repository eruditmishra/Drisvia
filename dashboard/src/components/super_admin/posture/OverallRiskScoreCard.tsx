import { TrendingUp, TrendingDown } from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["overallRisk"];
}

export default function OverallRiskScoreCard({ data }: Props) {
  const score = data.score;
  const maxScore = data.maxScore || 100;
  
  // SVG Semi-Circle Radial Gauge calculations:
  const radius = 54;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle circumference
  const strokeDashoffset = circumference - (score / maxScore) * circumference;

  const levelBadgeClass =
    data.level === "Critical"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : data.level === "Elevated Risk" || data.level === "Elevated"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : data.level === "Moderate"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const hasDelta = data.delta !== null && data.delta !== undefined;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col md:flex-row items-center justify-between gap-5 hover:shadow-md transition-shadow duration-200 min-h-[155px]">
      {/* ── Left Gauge Area ── */}
      <div className="flex flex-col items-center justify-center shrink-0 min-w-[170px]">
        <div className="relative w-[140px] h-[80px] flex items-end justify-center overflow-hidden">
          <svg
            className="w-[140px] h-[140px] transform -rotate-180 absolute -top-[5px]"
            viewBox="0 0 140 140"
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="35%" stopColor="#FBBF24" />
                <stop offset="70%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center z-10 -mb-0.5">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{score}</span>
            <span className="text-xs font-semibold text-slate-400"> / {maxScore}</span>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-600 mt-1">Overall AI Risk Score</div>
        <div className="mt-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${levelBadgeClass}`}>
            {data.level}
          </span>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
          {data.headline}
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-sm">
          {data.description}
        </p>

        {hasDelta && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-50">
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-bold">
              {data.deltaDirection === "down" ? (
                <TrendingDown size={12} className="text-emerald-600" />
              ) : (
                <TrendingUp size={12} className="text-rose-600" />
              )}
              <span>{data.delta! > 0 ? `+${data.delta}` : data.delta}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {data.deltaPeriod}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
