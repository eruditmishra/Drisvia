import { Search, Filter, X } from "lucide-react";

interface IdentitiesFilterBarProps {
  providers: string[];
  statuses: string[];
  activeFilters: {
    search: string;
    provider: string;
    status: string;
  };
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

const PROVIDER_NAMES: Record<string, string> = {
  entra_agent_id: "Azure Entra ID",
  azure: "Azure",
  aws: "AWS IAM",
  gcp: "Google Cloud IAM",
};

const STATUS_LABELS: Record<string, string> = {
  shadow: "Shadow (Unreviewed)",
  approved: "Approved",
  conditionally_approved: "Conditionally Approved",
  under_review: "Under Review",
  flagged: "Flagged / Rejected",
  deprecated: "Deprecated",
};

export default function IdentitiesFilterBar({
  providers,
  statuses,
  activeFilters,
  onChange,
  onClear,
}: IdentitiesFilterBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");

  return (
    <div className="bg-glass-white backdrop-blur-glass border border-glass-border rounded-r12 shadow-glass p-4 mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-text-primary text-[13px] flex items-center gap-2">
          <Filter size={14} className="text-brand" />
          Filter & Search Identities
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X size={12} /> Clear Filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-text-muted" />
          </div>
          <input
            type="text"
            placeholder="Search identities by name, object ID, or tenant..."
            value={activeFilters.search}
            onChange={(e) => onChange("search", e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-glass-border-dim rounded-r8 bg-white/70 text-[12px] placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
          />
        </div>

        {/* Provider dropdown */}
        <select
          value={activeFilters.provider}
          onChange={(e) => onChange("provider", e.target.value)}
          className="py-1.5 px-3 border border-glass-border-dim rounded-r8 bg-white/70 text-[12px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
        >
          <option value="">All Identity Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_NAMES[p] || p.replace(/_/g, " ")}
            </option>
          ))}
          {!providers.includes("entra_agent_id") && (
            <option value="entra_agent_id">Azure Entra ID</option>
          )}
        </select>

        {/* Status dropdown */}
        <select
          value={activeFilters.status}
          onChange={(e) => onChange("status", e.target.value)}
          className="py-1.5 px-3 border border-glass-border-dim rounded-r8 bg-white/70 text-[12px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statuses.length > 0
            ? statuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s.replace(/_/g, " ")}
                </option>
              ))
            : [
                "shadow",
                "under_review",
                "approved",
                "conditionally_approved",
                "flagged",
                "deprecated",
              ].map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
        </select>
      </div>
    </div>
  );
}
