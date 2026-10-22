interface StatCardProps {
  color?: "brand" | "royal" | "red" | "amber" | "purple" | "green" | "carbon";
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  onClick?: () => void;
}

export default function StatCard({
  color = "royal",
  label,
  value,
  sub,
  trend,
  onClick,
}: StatCardProps) {
  const badgeMap = {
    brand: "bg-[#EAF2FF] text-[#2563EB] border-[#C8DCFE]",
    royal: "bg-[#EAF2FF] text-[#2563EB] border-[#C8DCFE]",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-[#EAF2FF] text-[#2563EB] border-[#C8DCFE]",
    carbon: "bg-slate-100 text-[#1D2329] border-slate-200",
  };

  const badgeClass = badgeMap[color] || badgeMap.royal;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 bg-white rounded-2xl border border-[#DCE7F9] shadow-[0_2px_10px_rgba(12,23,49,0.04)] transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(12,23,49,0.08)] hover:border-[#2563EB]/40"
          : ""
      }`}
    >
      {/* Header Row: Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-extrabold text-[#64748b] tracking-wider uppercase">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="font-display text-[38px] font-extrabold text-[#1D2329] leading-tight mb-3 tracking-tight">
        {value}
      </div>

      {/* Footer Row: Subtext & Trend */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#F0F4FC]">
        {sub && (
          <div className="text-[12px] text-text-secondary font-medium truncate capitalize">
            {sub}
          </div>
        )}

        {trend && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shrink-0 ${badgeClass}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
