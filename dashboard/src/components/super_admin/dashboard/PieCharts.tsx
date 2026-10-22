import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Cloud, Cpu, ArrowUpRight } from "lucide-react";
import type { DashboardData } from "../../../types/dashboard";

interface PieChartsProps {
  charts: DashboardData["charts"];
}

// 5-Color Palette Aligned Chart Colors:
// Royal Blue (#2563EB), Prussian Blue (#0C1731), Carbon Black (#1D2329), Alice Blue-tinted Sky (#0284C7), Emerald & Amber accents
const COLORS = [
  "#2563EB", // Royal Blue
  "#0C1731", // Prussian Blue
  "#0284C7", // Sky Blue
  "#1D2329", // Carbon Black
  "#10B981", // Emerald
  "#F59E0B", // Amber
];

const RISK_COLORS: Record<string, string> = {
  Critical: "#EF4444",
  High: "#F59E0B",
  Medium: "#2563EB", // Royal Blue
  Low: "#10B981",
};

const PROVIDER_COLORS: Record<string, string> = {
  AWS: "#F97316",
  Azure: "#2563EB", // Royal Blue
  GCP: "#EA4335",
  Google: "#EA4335",
  "Google Cloud": "#EA4335",
  OpenAI: "#10A37F",
  Anthropic: "#D97706",
  Custom: "#0C1731", // Prussian Blue
};

export default function PieCharts({ charts }: PieChartsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* ── 1. Risk Level Breakdown ── */}
      <div className="bg-white rounded-2xl border border-[#DCE7F9] shadow-[0_2px_12px_rgba(12,23,49,0.04)] p-5 flex flex-col hover:shadow-[0_8px_24px_rgba(12,23,49,0.06)] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="font-bold text-text-primary text-[13px]">
                Risk Levels
              </div>
              <div className="text-[10px] text-text-muted">Security &amp; compliance posture</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#2563EB] bg-[#EAF2FF] px-2 py-0.5 rounded-full border border-[#C8DCFE]">
            Posture
          </span>
        </div>

        <div className="flex-1 w-full min-h-[220px] flex flex-col justify-center">
          {charts.risk.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center mb-2">
                <ShieldCheck size={20} />
              </div>
              <span className="text-xs font-bold text-text-primary">No Risk Anomalies</span>
              <span className="text-[11px] text-text-muted mt-0.5">All monitored agents within safe thresholds</span>
            </div>
          ) : (
            <div className="space-y-3.5 my-auto">
              {(() => {
                const maxRisk = Math.max(...charts.risk.map((r) => r.value), 1);
                return charts.risk.map((entry) => {
                  const pct = Math.round((entry.value / maxRisk) * 100);
                  const color = RISK_COLORS[entry.name] || COLORS[0];
                  return (
                    <div key={entry.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-text-primary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          {entry.name}
                        </span>
                        <span className="text-text-muted font-mono font-bold text-[11px]">
                          {entry.value}
                        </span>
                      </div>
                      <div className="h-2 bg-[#EAF2FF] rounded-full overflow-hidden border border-[#DCE7F9]/80">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Provider Distribution ── */}
      <div className="bg-white rounded-2xl border border-[#DCE7F9] shadow-[0_2px_12px_rgba(12,23,49,0.04)] p-5 flex flex-col hover:shadow-[0_8px_24px_rgba(12,23,49,0.06)] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center">
              <Cloud size={16} />
            </div>
            <div>
              <div className="font-bold text-text-primary text-[13px]">
                Agent Distribution
              </div>
              <div className="text-[10px] text-text-muted">Cloud &amp; local deployments</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-text-secondary bg-[#F4F8FD] px-2 py-0.5 rounded-full border border-[#DCE7F9]">
            {charts.provider.length} Sources
          </span>
        </div>

        <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
          {charts.provider.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center mb-2">
                <Cloud size={20} />
              </div>
              <span className="text-xs font-bold text-text-primary">No Sources Discovered</span>
              <span className="text-[11px] text-text-muted mt-0.5">Run a scan to map provider workloads</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.provider}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.provider.map((entry, index) => {
                    let color = COLORS[index % COLORS.length];
                    for (const [key, val] of Object.entries(PROVIDER_COLORS)) {
                      if (
                        entry.name.toLowerCase().includes(key.toLowerCase())
                      ) {
                        color = val;
                        break;
                      }
                    }
                    return <Cell key={`cell-${index}`} fill={color} stroke="#FFFFFF" strokeWidth={2} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #DCE7F9",
                    fontSize: "12px",
                    background: "#FFFFFF",
                    boxShadow: "0 10px 25px -5px rgba(12, 23, 49, 0.12)",
                    color: "#1D2329",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#1D2329", fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── 3. Models Distribution ── */}
      <div
        onClick={() => navigate("/models")}
        className="bg-white rounded-2xl border border-[#DCE7F9] shadow-[0_2px_12px_rgba(12,23,49,0.04)] p-5 flex flex-col cursor-pointer hover:border-[#2563EB]/40 hover:shadow-[0_12px_28px_-4px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center">
              <Cpu size={16} />
            </div>
            <div>
              <div className="font-bold text-text-primary text-[13px] flex items-center gap-1">
                Models Distribution
              </div>
              <div className="text-[10px] text-text-muted">Discovered LLM backends</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#2563EB] bg-[#EAF2FF] px-2 py-0.5 rounded-full border border-[#C8DCFE] flex items-center gap-0.5 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
            View All <ArrowUpRight size={11} />
          </span>
        </div>

        <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
          {charts.models.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center mb-2">
                <Cpu size={20} />
              </div>
              <span className="text-xs font-bold text-text-primary">No Models Indexed</span>
              <span className="text-[11px] text-text-muted mt-0.5">Click to view model discovery inventory</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.models}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.models.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ))}
                  <Label
                    value={charts.models.length}
                    position="center"
                    className="font-display text-2xl font-extrabold fill-text-primary"
                  />
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #DCE7F9",
                    fontSize: "12px",
                    background: "#FFFFFF",
                    boxShadow: "0 10px 25px -5px rgba(12, 23, 49, 0.12)",
                    color: "#1D2329",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#1D2329", fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
