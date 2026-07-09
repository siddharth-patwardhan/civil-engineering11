import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { projectPathOrLegacy } from "@/features/project/projectRoutes";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { formatInrCompact } from "@/lib/formatCurrency";

interface DashboardMetrics {
  totalProjects: number;
  activeEstimates: number;
  pendingQuotations: number;
  budgetVariance: number;
  recentProjects: { id: string; name: string; clientName: string | null; phase: string; updatedAt: string }[];
  costDistribution: { category: string; amount: number }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);

  const { data: metrics, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.fetch<DashboardMetrics>("/api/dashboard"),
    enabled: isAuthenticated,
    staleTime: 2 * 60_000,
  });

  const costChartData = useMemo(
    () =>
      (metrics?.costDistribution ?? []).map((d) => ({
        label: d.category,
        value: d.amount,
      })),
    [metrics?.costDistribution],
  );

  const materialChartData = useMemo(
    () =>
      (metrics?.costDistribution ?? [])
        .filter((d) => d.category !== "Earthwork")
        .map((d) => ({
          label: d.category,
          value: d.amount,
        })),
    [metrics?.costDistribution],
  );

  return (
    <div className="flex flex-col gap-6">
      {isError && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg">
          Failed to load dashboard data. {(error as Error)?.message}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-text-primary">Executive Overview</h1>
          <p className="font-body text-body text-text-secondary mt-1">
            Real-time estimations and cost tracking for active sites
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/create-project")}
            className="h-9 px-4 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
          <button
            onClick={() => navigate(projectPathOrLegacy(activeProjectId, "boq"))}
            className="h-9 px-4 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors"
          >
            Import BOQ
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Projects"
          value={isLoading ? "—" : String(metrics?.totalProjects ?? 0)}
          icon="architecture"
          trend="+3 this month"
          trendType="positive"
        />
        <MetricCard
          label="Active Estimates"
          value={isLoading ? "—" : String(metrics?.activeEstimates ?? 0)}
          icon="analytics"
          trend="In progress"
          trendType="neutral"
        />
        <MetricCard
          label="Pending Quotations"
          value={isLoading ? "—" : formatInrCompact(metrics?.pendingQuotations ?? 0)}
          icon="inventory_2"
          trend="Under review"
          trendType="warning"
        />
        <MetricCard
          label="Budget Variance"
          value={isLoading ? "—" : `${metrics?.budgetVariance ?? 0}%`}
          icon="payments"
          trend="Avg across sites"
          trendType={metrics && metrics.budgetVariance < 0 ? "negative" : "positive"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-h2 text-h2 text-text-primary">Cost Distribution</h3>
            <span className="font-label text-label text-text-muted">By BOQ category</span>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-text-muted font-body text-body">Loading…</div>
          ) : costChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-text-muted font-body text-body">
              No cost data yet. Create a BOQ to see distribution.
            </div>
          ) : (
            <SimpleBarChart data={costChartData} height={256} />
          )}
        </div>
        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-h2 text-h2 text-text-primary">Material Breakdown</h3>
            <span className="font-label text-label text-text-muted">Excl. earthwork</span>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-text-muted font-body text-body">Loading…</div>
          ) : materialChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-text-muted font-body text-body">
              No material cost data available.
            </div>
          ) : (
            <SimpleBarChart data={materialChartData} height={256} />
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <h3 className="font-h2 text-h2 text-text-primary">Recently Opened Projects</h3>
          <button
            onClick={() => navigate("/projects")}
            className="font-table text-table text-accent-primary hover:underline"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-elevated border-b border-border-default">
                <th scope="col" className="px-4 py-2 font-label text-label text-text-secondary text-left">Project</th>
                <th scope="col" className="px-4 py-2 font-label text-label text-text-secondary text-left">Client</th>
                <th scope="col" className="px-4 py-2 font-label text-label text-text-secondary text-left">Phase</th>
                <th scope="col" className="px-4 py-2 font-label text-label text-text-secondary text-left">Updated</th>
                <th scope="col" className="px-4 py-2 font-label text-label text-text-secondary text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.recentProjects ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted font-body text-body">
                    No recent projects. <button onClick={() => navigate("/create-project")} className="text-accent-primary hover:underline">Create one</button>
                  </td>
                </tr>
              )}
              {(metrics?.recentProjects ?? []).map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border-default hover:bg-bg-hover transition-colors cursor-pointer ${i % 2 === 0 ? "bg-bg-surface" : "bg-bg-primary"}`}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    navigate(projectPathOrLegacy(p.id, "measurement"));
                  }}
                >
                  <td className="px-4 py-3 font-table text-table text-text-primary">{p.name}</td>
                  <td className="px-4 py-3 font-table text-table text-text-secondary">{p.clientName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-status-neutral font-label text-label">{p.phase}</span>
                  </td>
                  <td className="px-4 py-3 font-table text-table text-text-muted">{p.updatedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveProjectId(p.id);
                        navigate(projectPathOrLegacy(p.id, "measurement")); 
                      }}
                      className="font-table text-table text-accent-primary hover:underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MetricCard                                                        */
/* ------------------------------------------------------------------ */
function MetricCard({
  label,
  value,
  icon,
  trend,
  trendType,
}: {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendType: "positive" | "negative" | "neutral" | "warning";
}) {
  const trendClass = {
    positive: "text-accent-success",
    negative: "text-accent-danger",
    neutral: "text-text-muted",
    warning: "text-accent-warning",
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className="font-label text-label text-text-secondary">{label}</span>
        <span className="material-symbols-outlined text-text-muted text-[20px]">{icon}</span>
      </div>
      <div>
        <span className="font-display text-display text-text-primary">{value}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`font-table text-table ${trendClass[trendType]}`}>{trend}</span>
      </div>
    </div>
  );
}
