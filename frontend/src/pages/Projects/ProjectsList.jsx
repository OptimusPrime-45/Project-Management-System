import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, List, Search, Loader2 } from "lucide-react";
import { useProjects } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import ProjectCard from "../../components/Project/ProjectCard";
import ProjectForm from "../../components/Project/ProjectForm";
import { EmptyState } from "../../components/Common/EmptyState";
import { SkeletonCard } from "../../components/Common/Skeleton";
import PageTransition from "../../components/Common/PageTransition";
import Breadcrumb from "../../components/Common/Breadcrumb";

const ProjectsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects,
    loading,
    error,
    fetchProjects,
    addProject,
    editProject,
    removeProject,
  } = useProjects();

  // Only super admins can create new projects
  const canCreateProject = user?.isSuperAdmin === true;

  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("grid");
  const [modalState, setModalState] = useState({
    open: false,
    mode: "create",
    project: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const query = searchTerm.toLowerCase();
    return projects.filter(
      (project) =>
        project.name?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchTerm]);

  const closeModal = () =>
    setModalState({ open: false, mode: "create", project: null });

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    const result = await addProject(payload);
    setIsSubmitting(false);
    if (result.success) {
      closeModal();
    }
  };

  const handleUpdate = async (payload) => {
    if (!modalState.project) return;
    const projectId = modalState.project.id ?? modalState.project._id;
    setIsSubmitting(true);
    const result = await editProject(projectId, payload);
    setIsSubmitting(false);
    if (result.success) {
      closeModal();
    }
  };

  const handleDelete = async (project) => {
    const projectId = project.id ?? project._id;
    const confirmed = window.confirm(
      `Delete project "${project.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await removeProject(projectId);
  };

  const renderProjects = () => {
    if (loading) {
      return (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              : "space-y-4"
          }
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-error/20 bg-error/5 p-6 text-center">
          <p className="text-error font-semibold">{error}</p>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <EmptyState
          type={searchTerm ? "search" : "projects"}
          title={searchTerm ? "No projects found" : "No projects yet"}
          description={
            searchTerm
              ? "Try a different search keyword."
              : canCreateProject 
                ? "Create your first project to get started with managing your team's work."
                : "You don't have any projects yet. Ask an admin to add you to a project."
          }
          actionLabel={canCreateProject ? "Create Project" : undefined}
          action={canCreateProject ? () =>
            setModalState({ open: true, mode: "create", project: null })
          : undefined}
        />
      );
    }

    return (
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            : "space-y-4"
        }
      >
        {filteredProjects.map((project, idx) => {
          // Check if user can manage this specific project
          const projectRole = (project.role || project.currentUserRole || "").toLowerCase();
          const canManageProject = user?.isSuperAdmin === true || projectRole === "project_admin";
          
          return (
            <div
              key={project.id || project._id}
              className="animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <ProjectCard
                project={project}
                onView={(proj) => navigate(`/projects/${proj.id || proj._id}`)}
                onEdit={canManageProject ? (proj) =>
                  setModalState({ open: true, mode: "edit", project: proj })
                : undefined}
                onDelete={canManageProject ? handleDelete : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const showModal = modalState.open;
  const isEditMode = modalState.mode === "edit";

  return (
    <PageTransition>
      <section className="space-y-6">
        <Breadcrumb />
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              Projects
            </p>
            <h1 className="text-4xl font-bold text-foreground">Workspaces</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Manage all the projects you're part of. Create new initiatives or
              jump back into active work.
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-card-border px-4 py-2.5 bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2 self-stretch">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`h-10 w-10 rounded-xl border transition-all ${
                  view === "grid"
                    ? "gradient-primary text-white border-transparent shadow-md"
                    : "border-card-border bg-card text-muted-foreground hover:bg-muted"
                } flex items-center justify-center`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`h-10 w-10 rounded-xl border transition-all ${
                  view === "list"
                    ? "gradient-primary text-white border-transparent shadow-md"
                    : "border-card-border bg-card text-muted-foreground hover:bg-muted"
                } flex items-center justify-center`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              {canCreateProject && (
                <button
                  type="button"
                  onClick={() =>
                    setModalState({ open: true, mode: "create", project: null })
                  }
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all btn-hover"
                >
                  <Plus size={16} />
                  Create Project
                </button>
              )}
            </div>
          </div>
        </header>

        {renderProjects()}

        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl animate-scale-in">
              <ProjectForm
                mode={modalState.mode}
                initialValues={modalState.project || undefined}
                onSubmit={isEditMode ? handleUpdate : handleCreate}
                onCancel={closeModal}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </section>
    </PageTransition>
  );
};

export default ProjectsList;
