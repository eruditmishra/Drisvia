import { Shield, AlertTriangle, Users, Database, ArrowUp } from "lucide-react";
import type { PostureDashboardData } from "../../../types/dashboard";

interface Props {
  kpis: PostureDashboardData["kpis"];
  onNavigate?: (tab: string) => void;
}

export default function PostureKpiCards({ kpis, onNavigate }: Props) {
  const cards = [
    {
      id: "critical",
      label: "Critical Risk Agents",
      value: kpis.criticalRiskAgents.value,
      delta: kpis.criticalRiskAgents.delta,
      deltaPeriod: kpis.criticalRiskAgents.deltaPeriod,
      icon: Shield,
      iconBg: "bg-rose-50 text-rose-500 border border-rose-100",
      trendColor: "text-rose-500",
      targetRoute: "/agents",
    },
    {
      id: "high",
      label: "High Risk Agents",
      value: kpis.highRiskAgents.value,
      delta: kpis.highRiskAgents.delta,
      deltaPeriod: kpis.highRiskAgents.deltaPeriod,
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-500 border border-amber-100",
      trendColor: "text-amber-600",
      targetRoute: "/agents",
    },
    {
      id: "shadow",
      label: "Shadow / Unmanaged",
      value: kpis.shadowAgents.value,
      delta: kpis.shadowAgents.delta,
      deltaPeriod: kpis.shadowAgents.deltaPeriod,
      icon: Users,
      iconBg: "bg-blue-50 text-blue-500 border border-blue-100",
      trendColor: "text-rose-500",
      targetRoute: "/agents/shadow",
    },
    {
      id: "sensitive",
      label: "Agents with Sensitive Access",
      value: kpis.sensitiveAccess.value,
      delta: kpis.sensitiveAccess.delta,
      deltaPeriod: kpis.sensitiveAccess.deltaPeriod,
      icon: Database,
      iconBg: "bg-emerald-50 text-emerald-500 border border-emerald-100",
      trendColor: "text-rose-500",
      targetRoute: "/agents",
    },
  ];

  return (
    <>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onNavigate?.(card.targetRoute)}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon size={18} />
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-slate-600 truncate">
                {card.label}
              </div>
            </div>

            <div className="flex items-center gap-1 mt-3">
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${card.trendColor}`}>
                <ArrowUp size={11} strokeWidth={3} />
                <span>{card.delta}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {card.deltaPeriod}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
