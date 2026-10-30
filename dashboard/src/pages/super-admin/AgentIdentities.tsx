import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Fingerprint, ArrowLeft } from "lucide-react";
import { discoveryAPI } from "../../lib/api";
import type { DiscoveredAgent, AgentFilters } from "../../types/discovery";
import IdentitiesFilterBar from "../../components/super_admin/identities/IdentitiesFilterBar";
import IdentitiesTable from "../../components/super_admin/identities/IdentitiesTable";
import Pagination from "../../components/super_admin/agents/Pagination";
import UpdateAgentStatusModal from "../../components/super_admin/agents/UpdateAgentStatusModal";
import StatCard from "../../components/shared/StatCard";

const PAGE_SIZE = 20;

export default function AgentIdentities() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [agents, setAgents] = useState<DiscoveredAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DiscoveredAgent | null>(null);

  const [filterOptions, setFilterOptions] = useState<AgentFilters>({
    models: [],
    providers: [],
    owners: [],
    types: [],
    statuses: [],
  });

  // Stats derived from the loaded data
  const [identityStats, setIdentityStats] = useState<{
    total: number;
    shadow: number;
    approved: number;
  } | null>(null);

  // Extract state from URL
  const activeFilters = {
    search: searchParams.get("search") || "",
    provider: searchParams.get("provider") || "",
    status: searchParams.get("status") || "",
  };
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Fetch filter options on mount + quick stats
  useEffect(() => {
    discoveryAPI
      .getAgentFilters()
      .then((res) => setFilterOptions(res.data))
      .catch((err) => console.error("Failed to load filter options", err));

    // Fetch all identity records for stats (no pagination)
    discoveryAPI
      .getAgents({ hasModel: false, limit: 1000, offset: 0 })
      .then((res) => {
        const all = res.data.agents as DiscoveredAgent[];
        setIdentityStats({
          total: res.data.total,
          shadow: all.filter((a) =>
            ["shadow", "flagged", "under_review", "deprecated"].includes(a.status)
          ).length,
          approved: all.filter((a) =>
            ["approved", "conditionally_approved"].includes(a.status)
          ).length,
        });
      })
      .catch(console.error);
  }, []);

  // Fetch paged data when URL changes
  useEffect(() => {
    setLoading(true);
    discoveryAPI
      .getAgents({
        search: activeFilters.search,
        provider: activeFilters.provider,
        status: activeFilters.status,
        hasModel: false, // Only modelless records — pure Entra identities / service principals
        sortBy,
        sortOrder,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
      .then((res) => {
        setAgents(res.data.agents);
        setTotal(res.data.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load identities", err);
        setLoading(false);
      });
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set("sortBy", sortBy);
    newParams.set("sortOrder", sortOrder);
    setSearchParams(newParams);
  };

  const handleSort = (field: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (sortBy === field) {
      newParams.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      newParams.set("sortBy", field);
      newParams.set("sortOrder", "asc");
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const handleUpdateStatus = async (
    agentId: string,
    actionType: "request" | "approve" | "reject",
    payload?: string,
    remark?: string
  ) => {
    try {
      let res;
      if (actionType === "request") {
        res = await discoveryAPI.requestAgentApproval(agentId, payload!, remark!);
      } else {
        res = await discoveryAPI.approveAgent(agentId, actionType, remark, payload);
      }

      setIsModalOpen(false);
      setSelectedAgent(null);

      const updatedAgent = res.data.agent;
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updatedAgent : a)));
    } catch (err) {
      console.error("Failed to update identity status:", err);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full overflow-y-auto animate-view-in">
      {/* ── Page Header ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1 text-[11px] font-semibold text-slate-400">
          <Link to="/agents" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft size={12} /> Agents
          </Link>
          <span>/</span>
          <span className="text-slate-600">Identities</span>
        </div>
        <h1 className="text-[22px] font-display font-extrabold text-slate-900 tracking-tight select-none flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-purple-600 rounded-full"></div>
          Agent Identities
        </h1>
        <p className="text-[13px] text-slate-500 mt-1 ml-4 leading-relaxed max-w-4xl">
          Microsoft Entra service principals, managed identities, and app registrations assigned to AI agent workloads.
          Identities govern autonomous execution scopes, delegated credentials, and tool permissions across your estate.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      {identityStats && (
        <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
          <StatCard
            color="purple"
            label="TOTAL IDENTITIES"
            value={identityStats.total}
            sub="All discovered agent identities"
            onClick={() => handleFilterChange("status", "")}
          />
          <StatCard
            color="amber"
            label="UNREVIEWED"
            value={identityStats.shadow}
            sub="Shadow or unreviewed identities"
            onClick={() => handleFilterChange("status", "shadow")}
          />
          <StatCard
            color="green"
            label="APPROVED"
            value={identityStats.approved}
            sub="Verified agent identities"
            onClick={() => handleFilterChange("status", "approved")}
          />
        </div>
      )}

      {/* ── Information Callout ── */}
      <div className="mb-4 flex items-start gap-3 bg-purple-50/80 border border-purple-200/80 rounded-xl px-4 py-3 text-[12.5px] text-purple-900 shadow-xs">
        <Fingerprint className="w-4 h-4 mt-0.5 shrink-0 text-purple-600" />
        <div className="leading-relaxed">
          <strong>Agent Identity Registrations</strong> (Entra App Registrations, Managed Identities) represent
          autonomous identities credentialed to execute tools and access APIs. They are{" "}
          <strong>distinct from agent workloads</strong> — see{" "}
          <Link to="/agents" className="underline font-semibold text-purple-700 hover:text-purple-900">
            All Agents
          </Link>{" "}
          for active AI model instances and runtime workloads.
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <IdentitiesFilterBar
        providers={filterOptions.providers}
        statuses={filterOptions.statuses}
        activeFilters={activeFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* ── Table & Loading States ── */}
      {loading && agents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="flex flex-col relative group">
          {loading && (
            <div className="absolute inset-0 bg-bg-root/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          )}
          <IdentitiesTable
            agents={agents}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onOpenUpdateModal={(agent) => {
              setSelectedAgent(agent);
              setIsModalOpen(true);
            }}
          />
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
          />
        </div>
      )}

      {/* ── Update Status Modal ── */}
      <UpdateAgentStatusModal
        isOpen={isModalOpen}
        agent={selectedAgent}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateStatus}
      />
    </div>
  );
}
