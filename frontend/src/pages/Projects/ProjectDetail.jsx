import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  FolderKanban,
  ClipboardList,
  StickyNote,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useProjects } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import ProjectForm from "../../components/Project/ProjectForm";
import ProjectMembers from "./ProjectMembers";
import ProjectSettings from "./ProjectSettings";
import ProjectTasks from "./ProjectTasks";
import ProjectNotes from "./ProjectNotes";
import { toggleProjectCompletion } from "../../api/projects";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes" },
  { key: "members", label: "Members" },
  { key: "settings", label: "Settings" },
];

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentProject,
    loading,
    error,
    getProjectById,
    editProject,
    removeProject,
    members,
    membersLoading,
    memberError,
    fetchProjectMembers,
    addMember,
    updateMember,
    removeMember,
    leaveProject,
  } = useProjects();

  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId);
      fetchProjectMembers(projectId);
    }
  }, [projectId, getProjectById, fetchProjectMembers]);

  // Refresh project data when switching to overview tab
  useEffect(() => {
    if (activeTab === "overview" && projectId) {
      getProjectById(projectId);
    }
  }, [activeTab, projectId, getProjectById]);

  useEffect(() => {
    setActiveTab("overview");
  }, [projectId]);

  const role = (
    currentProject?.role ||
    currentProject?.currentUserRole ||
    ""
  ).toUpperCase();
  // Check if user is super admin from JWT token or from project role
  const isSuperAdmin = user?.isSuperAdmin === true || role === "SUPER_ADMIN";
  const canManage = isSuperAdmin || role === "PROJECT_ADMIN";
  const canManageAdmins = isSuperAdmin;

  // Debug: Log permissions and data
  console.log("ProjectDetail Permissions:", {
    userId: user?._id,
    username: user?.username,
    isSuperAdminFromToken: user?.isSuperAdmin,
    projectRole: currentProject?.role,
    computedRole: role,
    isSuperAdmin,
    canManage,
    canManageAdmins,
  });

  console.log("ProjectDetail Data:", {
    currentProject,
    stats: currentProject?.stats,
    recentTasks: currentProject?.recentTasks,
    recentNotes: currentProject?.recentNotes,
  });

  const overviewStats = useMemo(() => {
    const stats = currentProject?.stats || {};
    console.log("Computing overviewStats with:", { stats, currentProject });
    return [
      {
        label: "Total Tasks",
        value: stats.totalTasks ?? currentProject?.taskCount ?? 0,
        icon: ClipboardList,
      },
      {
        label: "Tasks In Progress",
        value: stats.inProgress ?? currentProject?.taskInProgress ?? 0,
        icon: FolderKanban,
      },
      {
        label: "Total Notes",
        value: stats.totalNotes ?? currentProject?.noteCount ?? 0,
        icon: StickyNote,
      },
      {
        label: "Members",
        value:
          stats.members ?? currentProject?.members?.length ?? members.length,
        icon: Users,
      },
    ];
  }, [currentProject, members.length]);

  const handleUpdate = async (payload) => {
    if (!currentProject) return;
    const id = currentProject.id ?? currentProject._id;
    setIsSubmitting(true);
    const result = await editProject(id, payload);
    setIsSubmitting(false);
    if (result.success) {
      setShowForm(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    const id = currentProject.id ?? currentProject._id;
    const confirmed = window.confirm(
      `Delete project "${currentProject.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    const result = await removeProject(id);
    if (result.success) {
      navigate("/projects");
    }
  };

  const handleToggleCompletion = async () => {
    if (!currentProject) return;
    const id = currentProject.id ?? currentProject._id;
    const action = currentProject.isCompleted
      ? "mark as incomplete"
      : "mark as complete";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this project?`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await toggleProjectCompletion(id);
      // Refresh project data
      await getProjectById(id);
    } catch (error) {
      console.error("Error toggling project completion:", error);
      alert(error.response?.data?.message || "Failed to update project status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                Project
              </p>
              {currentProject?.isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle2 size={14} /> Completed
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              {currentProject?.name}
            </h1>
            <p className="text-muted-foreground">
              {currentProject?.description || "No description provided."}
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleToggleCompletion}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentProject?.isCompleted
                    ? "border-muted-foreground text-muted-foreground hover:bg-muted/40"
                    : "border-success text-success hover:bg-success/10"
                }`}
              >
                <CheckCircle2 size={16} />
                {currentProject?.isCompleted
                  ? "Mark Incomplete"
                  : "Mark Complete"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
              >
                <Pencil size={16} /> Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error hover:bg-error/10"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {overviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="rounded-xl border border-border bg-background px-4 py-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <Icon size={18} className="text-primary" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Tasks</h2>
        </div>
        {currentProject?.recentTasks &&
        currentProject.recentTasks.length > 0 ? (
          <div className="space-y-2">
            {currentProject.recentTasks.map((task) => (
              <div
                key={task._id || task.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.assignedTo?.username || "Unassigned"} · {task.status}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === "high"
                      ? "bg-error/10 text-error"
                      : task.priority === "medium"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {task.priority || "low"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">
            No tasks yet. Create tasks to track your work.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Notes</h2>
        </div>
        {currentProject?.recentNotes &&
        currentProject.recentNotes.length > 0 ? (
          <div className="space-y-2">
            {currentProject.recentNotes.map((note) => (
              <div
                key={note._id || note.id}
                className="p-3 rounded-lg border border-border hover:bg-muted/50"
              >
                <p className="text-sm font-medium text-foreground">
                  {note.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {note.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {note.createdBy?.username || "Unknown"} ·{" "}
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">
            No notes yet. Add your first note to document ideas and decisions.
          </div>
        )}
      </section>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "tasks":
        return (
          <ProjectTasks
            projectId={projectId}
            canManage={canManage}
            members={members}
          />
        );
      case "notes":
        return <ProjectNotes projectId={projectId} canManage={canManage} />;
      case "members":
        return (
          <ProjectMembers
            projectId={projectId}
            members={members}
            membersLoading={membersLoading}
            memberError={memberError}
            canManage={canManage}
            canManageAdmins={canManageAdmins}
            fetchMembers={fetchProjectMembers}
            onAdd={addMember}
            onRoleChange={updateMember}
            onRemove={removeMember}
            onLeave={async (pId) => {
              const result = await leaveProject(pId);
              if (result.success) {
                navigate("/projects");
              }
              return result;
            }}
          />
        );
      case "settings":
        return (
          <ProjectSettings
            project={currentProject}
            onEdit={() => setShowForm(true)}
            onDelete={handleDelete}
          />
        );
      default:
        return null;
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading project…
      </div>
    );
  }

  if (error && !currentProject) {
    return <p className="text-error">{error}</p>;
  }

  if (!currentProject) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  return (
    <section className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {renderTab()}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <ProjectForm
              mode="edit"
              initialValues={currentProject}
              onSubmit={handleUpdate}
              onCancel={() => setShowForm(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectDetail;
