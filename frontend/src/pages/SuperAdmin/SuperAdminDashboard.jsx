import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Loader2,
  RefreshCcw,
  Server,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useSuperAdmin } from "../../context/SuperAdminContext";
import { getHealthcheck } from "../../api/healthcheck";

const SuperAdminDashboard = () => {
  const { systemStats, fetchSystemStats, superAdminLoading, superAdminError } =
    useSuperAdmin();
  const [backendStatus, setBackendStatus] = useState({
    status: "checking",
    message: "",
    lastChecked: null,
  });

  const checkBackendHealth = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, status: "checking" }));
    try {
      const response = await getHealthcheck();
      setBackendStatus({
        status: "online",
        message: response?.message || "All systems operational",
        lastChecked: new Date(),
      });
    } catch (error) {
      setBackendStatus({
        status: "offline",
        message: error.message || "Backend unreachable",
        lastChecked: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    if (!systemStats) {
      fetchSystemStats();
    }
    checkBackendHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemStats, systemStats, checkBackendHealth]);

  const cards = useMemo(
    () => [
      {
        label: "Total Users",
        value: systemStats?.totalUsers ?? "—",
        helper: `${systemStats?.usersToday ?? 0} joined today`,
        icon: Users,
      },
      {
        label: "Projects",
        value: systemStats?.totalProjects ?? "—",
        helper: `${systemStats?.activeProjects ?? 0} active / ${
          systemStats?.inactiveProjects ?? 0
        } inactive`,
        icon: FolderOpen,
      },
      {
        label: "Tasks",
        value: systemStats?.totalTasks ?? "—",
        helper: `${systemStats?.doneTasks ?? 0} completed`,
        icon: ClipboardList,
      },
      {
        label: "Notes",
        value: systemStats?.totalNotes ?? "—",
        helper: `${systemStats?.recentNotes ?? 0} added this week`,
        icon: BarChart3,
      },
    ],
    [systemStats]
  );

  const healthPercent = useMemo(() => {
    if (!systemStats || !systemStats.totalProjects) return 0;
    return Math.round(
      (systemStats.activeProjects / Math.max(systemStats.totalProjects, 1)) *
        100
    );
  }, [systemStats]);

  const quickActions = [
    {
      label: "Manage Users",
      description: "Verify accounts, promote admins, remove access",
      to: "/super-admin/users",
      icon: Users,
      accent: "text-primary",
    },
    {
      label: "Manage Projects",
      description: "Review project health, delete rogue spaces",
      to: "/super-admin/projects",
      icon: FolderOpen,
      accent: "text-emerald-500",
    },
  ];

  const showSkeleton = superAdminLoading && !systemStats;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Super Admin
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            System Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor platform health, track growth trends, and take quick action
            when something looks off.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSystemStats}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          {superAdminLoading && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
          Refresh stats
        </button>
      </header>

      {superAdminError && (
        <div className="rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error">
          {superAdminError}
        </div>
      )}

      {showSkeleton ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-foreground">
                        {card.value}
                      </p>
                    </div>
                    <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {card.helper}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Quick actions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Jump directly into high-impact admin flows.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="rounded-2xl border border-border p-4 transition hover:border-primary"
                    >
                      <div
                        className={`rounded-xl bg-primary/10 p-2 ${action.accent}`}
                      >
                        <Icon size={18} />
                      </div>
                      <p className="mt-3 text-base font-semibold text-foreground">
                        {action.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    System health
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Active vs inactive projects
                  </p>
                </div>
                <ShieldCheck className="text-emerald-500" size={20} />
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Active projects</span>
                  <span>{healthPercent}%</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-border">
                  <div
                    className="h-3 rounded-full bg-emerald-500"
                    style={{ width: `${healthPercent}%` }}
                    aria-valuenow={healthPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center justify-between">
                    <span>Active</span>
                    <span>{systemStats?.activeProjects ?? 0}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Inactive</span>
                    <span>{systemStats?.inactiveProjects ?? 0}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Unverified users</span>
                    <span>{systemStats?.unverifiedUsers ?? 0}</span>
                  </li>
                </ul>
              </div>
            </article>
          </section>

          {/* Backend Status Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server size={20} className="text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Backend Status
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    API server health check
                  </p>
                </div>
              </div>
              <button
                onClick={checkBackendHealth}
                disabled={backendStatus.status === "checking"}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition disabled:opacity-50"
              >
                {backendStatus.status === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw size={14} />
                )}
                Check
              </button>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
                  backendStatus.status === "online"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : backendStatus.status === "offline"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {backendStatus.status === "online" ? (
                  <CheckCircle2 size={18} />
                ) : backendStatus.status === "offline" ? (
                  <XCircle size={18} />
                ) : (
                  <Loader2 size={18} className="animate-spin" />
                )}
                <span className="font-medium capitalize">
                  {backendStatus.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {backendStatus.message || "Checking server status..."}
              </p>
            </div>
            {backendStatus.lastChecked && (
              <p className="mt-3 text-xs text-muted-foreground">
                Last checked: {backendStatus.lastChecked.toLocaleTimeString()}
              </p>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Recent activity
                  </h2>
                  <p className="text-sm text-muted-foreground">Last 7 days</p>
                </div>
                <Activity size={20} className="text-primary" />
              </div>
              <ul className="mt-6 space-y-3 text-sm text-foreground">
                <li className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>New projects</span>
                  <span className="font-semibold">
                    {systemStats?.recentProjects ?? 0}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>New tasks</span>
                  <span className="font-semibold">
                    {systemStats?.recentTasks ?? 0}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>New notes</span>
                  <span className="font-semibold">
                    {systemStats?.recentNotes ?? 0}
                  </span>
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Task distribution
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Across all projects
                  </p>
                </div>
                <RefreshCcw size={20} className="text-primary" />
              </div>
              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "Todo",
                    value: systemStats?.todoTasks ?? 0,
                    color: "bg-amber-400",
                  },
                  {
                    label: "In progress",
                    value: systemStats?.inProgressTasks ?? 0,
                    color: "bg-sky-400",
                  },
                  {
                    label: "Done",
                    value: systemStats?.doneTasks ?? 0,
                    color: "bg-emerald-500",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm text-foreground">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-border">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{
                          width: `${
                            systemStats?.totalTasks
                              ? Math.min(
                                  100,
                                  (item.value / systemStats.totalTasks) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-2xl bg-muted" />
      ))}
    </section>
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl bg-muted p-6 lg:col-span-2" />
      <div className="rounded-2xl bg-muted p-6" />
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-muted p-6" />
      <div className="rounded-2xl bg-muted p-6" />
    </section>
  </div>
);

export default SuperAdminDashboard;
