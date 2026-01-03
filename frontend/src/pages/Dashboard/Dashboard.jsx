import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  CheckCircle2,
  Clock3,
  Users,
  Activity,
  Plus,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useProjects } from "../../context/ProjectContext";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { getAllTasks } from "../../api/tasks";
import { getNotifications } from "../../api/notifications";
import AnimatedCounter from "../../components/Dashboard/AnimatedCounter";
import DonutChart from "../../components/Dashboard/DonutChart";
import ProgressRing from "../../components/Dashboard/ProgressRing";
import QuickActions from "../../components/Dashboard/QuickActions";
import { SkeletonStats, SkeletonCard } from "../../components/Common/Skeleton";
import { EmptyState } from "../../components/Common/EmptyState";
import Breadcrumb from "../../components/Common/Breadcrumb";
import PageTransition from "../../components/Common/PageTransition";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading: projectsLoading, fetchProjects } = useProjects();
  const { userProjects, fetchUserProjects, userLoading } = useUser();
  const [myTasks, setMyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Fetch tasks assigned to current user
  const fetchMyTasks = useCallback(async () => {
    if (!userProjects.length || !user?._id) return;

    setTasksLoading(true);
    try {
      const responses = await Promise.allSettled(
        userProjects.map((project) => getAllTasks(project._id))
      );

      const tasks = [];
      responses.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const { value } = result;
          const projectTasks = Array.isArray(value?.tasks)
            ? value.tasks
            : Array.isArray(value)
            ? value
            : [];
          const projectName = userProjects[index]?.name || "Unknown Project";
          const projectId = userProjects[index]?._id;

          projectTasks.forEach((task) => {
            const assignedId = task.assignedTo?._id || task.assignedTo;
            if (
              assignedId === user._id &&
              (task.status || "TODO").toUpperCase() !== "DONE"
            ) {
              tasks.push({
                ...task,
                project: projectName,
                projectId,
              });
            }
          });
        }
      });

      // Sort by due date, tasks with due dates first
      tasks.sort((a, b) => {
        if (a.dueDate && b.dueDate)
          return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });

      setMyTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  }, [userProjects, user?._id]);

  // Fetch activity feed from notifications
  const fetchActivityFeed = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await getNotifications(10);
      const notifications = data.notifications || [];
      setActivityFeed(
        notifications.map((n) => ({
          id: n._id || n.id,
          actor: n.relatedUser?.username || "System",
          action: n.title,
          target: n.relatedProject?.name || "",
          time: getTimeAgo(n.createdAt),
          link: n.link,
        }))
      );
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    fetchProjects();
    fetchUserProjects();
    fetchActivityFeed();
  }, [fetchProjects, fetchUserProjects, fetchActivityFeed]);

  useEffect(() => {
    if (userProjects.length > 0) {
      fetchMyTasks();
    }
  }, [userProjects, fetchMyTasks]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.status !== "COMPLETED" && p.status !== "ARCHIVED"
    ).length;
    const allTasks = projects.reduce(
      (sum, p) => sum + (p.taskCount || p.stats?.totalTasks || 0),
      0
    );
    const completedTasks = projects.reduce(
      (sum, p) => sum + (p.stats?.completed || p.stats?.doneTasks || 0),
      0
    );
    const pendingTasks = allTasks - completedTasks;
    const totalMembers = projects.reduce(
      (sum, p) => sum + (p.members?.length || p.stats?.members || 0),
      0
    );

    return [
      {
        label: "Active Projects",
        value: activeProjects || 0,
        change: `${projects.length} total`,
        icon: FolderOpen,
        accent: "bg-primary/10 text-primary",
      },
      {
        label: "Tasks Completed",
        value: completedTasks || 0,
        change:
          allTasks > 0
            ? `${Math.round((completedTasks / allTasks) * 100)}% completion`
            : "0% completion",
        icon: CheckCircle2,
        accent: "bg-success/10 text-success",
      },
      {
        label: "Pending Tasks",
        value: pendingTasks || 0,
        change: `${allTasks} total tasks`,
        icon: Clock3,
        accent: "bg-warning/10 text-warning",
      },
      {
        label: "Team Members",
        value: totalMembers || 0,
        change: "Across all projects",
        icon: Users,
        accent: "bg-secondary/10 text-secondary",
      },
    ];
  }, [projects]);

  const recentProjects = useMemo(() => {
    return projects.slice(0, 3).map((project) => {
      const totalTasks = project.taskCount || project.stats?.totalTasks || 0;
      const completedTasks =
        project.stats?.completed || project.stats?.doneTasks || 0;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const status =
        progress >= 70
          ? "On Track"
          : progress >= 40
          ? "In Progress"
          : "At Risk";

      return {
        id: project._id || project.id,
        name: project.name,
        owner:
          project.creator?.username || project.owner?.username || "Unknown",
        progress,
        status,
      };
    });
  }, [projects]);

  const getDueDateDisplay = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const loading = projectsLoading || userLoading;

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
        <header className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </header>
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background text-foreground p-6 space-y-8 transition-colors duration-300">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          Overview
        </p>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          Executive Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track project health, task velocity, and team performance at a glance.
        </p>
      </header>

      {/* Quick Actions */}
      <QuickActions
        onCreateProject={() => navigate("/projects")}
        onCreateTask={() => navigate("/my-tasks")}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-animation">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="bg-card border border-card-border rounded-2xl p-5 shadow-sm card-hover animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    <AnimatedCounter end={card.value} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {card.change}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl ${card.accent} animate-scale-in`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm space-y-4 card-hover animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Recent Projects</h2>
              <p className="text-sm text-muted-foreground">
                Active initiatives led by your teams
              </p>
            </div>
            <button
              onClick={() => navigate("/projects")}
              className="inline-flex items-center gap-2 rounded-lg gradient-primary text-white px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all btn-hover"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project, idx) => (
                <article
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="border border-card-border rounded-xl p-4 cursor-pointer hover:border-primary transition-all card-hover group animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        <span className="font-medium">Owner:</span>{" "}
                        {project.owner}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing
                        progress={project.progress}
                        size={60}
                        strokeWidth={6}
                        color="var(--primary)"
                      />
                      <div className="text-right">
                        <p
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                            project.status === "On Track"
                              ? "bg-success/10 text-success"
                              : project.status === "In Progress"
                              ? "bg-primary/10 text-primary"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {project.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                type="projects"
                title="No projects yet"
                description="Get started by creating your first project"
                actionLabel="Create Project"
                onAction={() => navigate("/projects")}
              />
            )}
          </div>
        </div>

        <div
          className="bg-card border border-card-border rounded-2xl p-6 shadow-sm space-y-6 card-hover animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">My Tasks</h2>
              <p className="text-sm text-muted-foreground">
                Upcoming commitments assigned to you
              </p>
            </div>
            {myTasks.length > 0 && (
              <button
                onClick={() => navigate("/my-tasks")}
                className="text-sm text-primary hover:underline"
              >
                View all
              </button>
            )}
          </div>

          <div className="space-y-3">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading tasks...
              </div>
            ) : myTasks.length > 0 ? (
              myTasks.map((task, idx) => (
                <article
                  key={task._id || task.id}
                  onClick={() => navigate(`/projects/${task.projectId}?tab=tasks`)}
                  className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {task.project}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {getDueDateDisplay(task.dueDate)}
                        </p>
                      )}
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          (task.priority || "").toUpperCase() === "HIGH"
                            ? "bg-error/10 text-error"
                            : (task.priority || "").toUpperCase() === "MEDIUM"
                            ? "bg-warning/10 text-warning"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {task.priority || "Low"}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                type="tasks"
                title="No tasks assigned"
                description="Tasks will appear here when assigned to you"
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-card border border-card-border rounded-2xl p-6 shadow-sm lg:col-span-2 card-hover animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Activity Feed</h2>
              <p className="text-sm text-muted-foreground">
                Latest updates across workspaces
              </p>
            </div>
            <button
              onClick={() => navigate("/notifications")}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading activity...
              </div>
            ) : activityFeed.length > 0 ? (
              activityFeed.map((activity, idx) => (
                <article
                  key={activity.id}
                  onClick={() => activity.link && navigate(activity.link)}
                  className={`flex items-start gap-4 border border-card-border rounded-xl p-4 hover:border-primary/50 transition-all card-hover animate-fade-in ${activity.link ? 'cursor-pointer' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      <span className="font-bold text-foreground">
                        {activity.actor}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {activity.action}
                      </span>{" "}
                      {activity.target && (
                        <span className="font-semibold text-primary">
                          {activity.target}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      {activity.time}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                type="search"
                title="No recent activity"
                description="Activity will appear here as your team works"
              />
            )}
          </div>
        </div>

        <div
          className="bg-card border border-card-border rounded-2xl p-6 shadow-sm card-hover animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <h2 className="text-xl font-bold mb-6">Task Distribution</h2>

          <div className="flex justify-center mb-6">
            <DonutChart
              data={[
                {
                  label: "Completed",
                  value: stats[1].value,
                  color: "var(--success)",
                },
                {
                  label: "Pending",
                  value: stats[2].value,
                  color: "var(--warning)",
                },
              ]}
              size={140}
              strokeWidth={14}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <span className="text-sm font-bold">
                <AnimatedCounter end={stats[1].value} />
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="text-sm font-bold">
                <AnimatedCounter end={stats[2].value} />
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">Total Projects</span>
              </div>
              <span className="text-sm font-bold">
                <AnimatedCounter end={projects.length} />
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
};

export default Dashboard;
