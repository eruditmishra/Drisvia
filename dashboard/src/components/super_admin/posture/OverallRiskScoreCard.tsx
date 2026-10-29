import { TrendingUp, TrendingDown } from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  data: PostureDashboardData["overallRisk"];
}

export default function OverallRiskScoreCard({ data }: Props) {
  const score = data.score;
  const maxScore = data.maxScore || 100;
  
  // SVG Semi-Circle Radial Gauge calculations:
  // Radius = 65, Center at (80, 75). Angle from -180 deg to 0 deg (or 180 deg arc)
  const radius = 62;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle circumference
  const strokeDashoffset = circumference - (score / maxScore) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow duration-200">
      {/* ── Left Gauge Area ── */}
      <div className="flex flex-col items-center justify-center shrink-0 min-w-[210px]">
        <div className="relative w-[160px] h-[95px] flex items-end justify-center overflow-hidden">
          <svg
            className="w-[160px] h-[160px] transform -rotate-180 absolute -top-[5px]"
            viewBox="0 0 160 160"
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
              cx="80"
              cy="80"
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
              cx="80"
              cy="80"
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
          <div className="text-center z-10 -mb-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{score}</span>
            <span className="text-sm font-semibold text-slate-400"> / {maxScore}</span>
          </div>
        </div>
        <div className="text-[12px] font-semibold text-slate-600 mt-2">Overall AI Risk Score</div>
        <div className="mt-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200/70 inline-block">
            {data.level}
          </span>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
          {data.headline}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
          {data.description}
        </p>

        <div className="flex items-center gap-2 mt-4">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 text-xs font-bold">
            {data.deltaDirection === "down" ? (
              <TrendingDown size={14} className="text-emerald-600" />
            ) : (
              <TrendingUp size={14} className="text-rose-600" />
            )}
            <span>{data.delta > 0 ? `+${data.delta}` : data.delta}</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {data.deltaPeriod}
          </span>
        </div>
      </div>
    </div>
  );
}
