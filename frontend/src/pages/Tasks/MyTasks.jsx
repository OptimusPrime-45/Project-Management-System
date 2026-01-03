import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Loader2,
  PlayCircle,
  RefreshCcw,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { getAllTasks, updateTask } from "../../api/tasks";
import { EmptyState } from "../../components/Common/EmptyState";
import TaskKanban from "../../components/Task/TaskKanban";
import PageTransition from "../../components/Common/PageTransition";
import Breadcrumb from "../../components/Common/Breadcrumb";
import DueDateBadge from "../../components/Common/DueDateBadge";

const statusConfig = {
  TODO: {
    label: "To Do",
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: PlayCircle,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
  },
};

const priorityConfig = {
  HIGH: { label: "High", color: "bg-error/10 text-error" },
  MEDIUM: { label: "Medium", color: "bg-warning/10 text-warning" },
  LOW: { label: "Low", color: "bg-secondary/10 text-secondary" },
};

const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProjects, fetchUserProjects, userLoading } = useUser();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // list or kanban

  const fetchMyTasks = useCallback(async () => {
    if (!userProjects.length || !user?._id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const responses = await Promise.allSettled(
        userProjects.map((project) => getAllTasks(project._id))
      );

      const myTasks = [];
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
            if (assignedId === user._id) {
              myTasks.push({
                ...task,
                projectName,
                projectId,
              });
            }
          });
        }
      });

      // Sort by due date (tasks with due dates first, then by status)
      myTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });

      setTasks(myTasks);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [userProjects, user?._id]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  useEffect(() => {
    if (userProjects.length > 0) {
      fetchMyTasks();
    }
  }, [userProjects, fetchMyTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.projectName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (task.status || "TODO").toUpperCase() === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        (task.priority || "MEDIUM").toUpperCase() === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const taskStats = useMemo(() => {
    const todo = tasks.filter(
      (t) => (t.status || "TODO").toUpperCase() === "TODO"
    ).length;
    const inProgress = tasks.filter(
      (t) => (t.status || "TODO").toUpperCase() === "IN_PROGRESS"
    ).length;
    const done = tasks.filter(
      (t) => (t.status || "TODO").toUpperCase() === "DONE"
    ).length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return (
        new Date(t.dueDate) < new Date() &&
        (t.status || "TODO").toUpperCase() !== "DONE"
      );
    }).length;

    return { todo, inProgress, done, overdue, total: tasks.length };
  }, [tasks]);

  const handleTaskClick = (task) => {
    navigate(
      `/projects/${task.projectId}?tab=tasks&task=${task._id || task.id}`
    );
  };

  const getDueDateDisplay = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: "Due today", isOverdue: false };
    }
    if (diffDays === 1) {
      return { text: "Due tomorrow", isOverdue: false };
    }
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, isOverdue: false };
    }
    return { text: date.toLocaleDateString(), isOverdue: false };
  };

  const isLoading = loading || userLoading;

  const handleTaskStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    try {
      await updateTask(task.projectId, taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <Breadcrumb />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Personal
          </p>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-primary" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all tasks assigned to you across projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Kanban view"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button
            onClick={fetchMyTasks}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">To Do</p>
          <p className="text-2xl font-bold text-foreground">{taskStats.todo}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-primary">
            {taskStats.inProgress}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-success">{taskStats.done}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-error">{taskStats.overdue}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-input pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-input px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-border bg-input px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="all">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && tasks.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your tasks...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTasks.length === 0 && (
        <EmptyState
          type="tasks"
          title={
            search || statusFilter !== "all" || priorityFilter !== "all"
              ? "No tasks match your filters"
              : "No tasks assigned to you"
          }
          description={
            search || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Tasks will appear here when you're assigned to them in projects"
          }
        />
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && filteredTasks.length > 0 && (
        <TaskKanban
          tasks={filteredTasks}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskEdit={(task) => handleTaskClick(task)}
        />
      )}

      {/* List View */}
      {viewMode === "list" && (
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const status =
            statusConfig[(task.status || "TODO").toUpperCase()] ||
            statusConfig.TODO;
          const priority =
            priorityConfig[(task.priority || "MEDIUM").toUpperCase()] ||
            priorityConfig.MEDIUM;
          const StatusIcon = status.icon;
          const dueDisplay = getDueDateDisplay(task.dueDate);

          return (
            <article
              key={task._id || task.id}
              onClick={() => handleTaskClick(task)}
              className="rounded-2xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl ${status.bg}`}>
                  <StatusIcon size={20} className={status.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${priority.color}`}
                    >
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {task.projectName}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {dueDisplay && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          dueDisplay.isOverdue
                            ? "bg-error/10 text-error"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Clock size={12} />
                        {dueDisplay.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      )}
    </div>
    </PageTransition>
  );
};

export default MyTasks;
