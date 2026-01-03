import React, { useEffect, useMemo, useState } from "react";
import { Plus, LayoutGrid, List, Loader2 } from "lucide-react";
import TaskBoard from "../../components/Task/TaskBoard";
import TaskCard from "../../components/Task/TaskCard";
import TaskForm from "../../components/Task/TaskForm";
import SubTaskList from "../../components/Task/SubTaskList";
import { useTasks } from "../../context/TaskContext";
import { useAuth } from "../../context/AuthContext";

const ProjectTasks = ({ projectId, canManage, members = [] }) => {
  const { user } = useAuth();
  const {
    tasks,
    taskLoading,
    taskError,
    fetchTasks,
    addTask,
    editTask,
    removeTask,
    addSubTask,
    editSubTask,
    removeSubTask,
    fetchTaskDetails,
    selectedTask,
    setSelectedTask,
  } = useTasks();

  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState({ open: false, mode: "create", task: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [subtaskProcessing, setSubtaskProcessing] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  useEffect(() => {
    return () => setSelectedTask(null);
  }, [setSelectedTask]);

  const filteredTasks = useMemo(() => {
    if (!search) return tasks;
    const query = search.toLowerCase();
    return tasks.filter(
      (task) => task.title?.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
    );
  }, [tasks, search]);

  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce(
      (acc, task) => {
        const status = (task.status || "TODO").toUpperCase();
        acc[status] = acc[status] ? [...acc[status], task] : [task];
        return acc;
      },
      { TODO: [], IN_PROGRESS: [], DONE: [] }
    );
  }, [filteredTasks]);

  const closeModal = () => setModalState({ open: false, mode: "create", task: null });

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    const result = await addTask(projectId, payload);
    setIsSubmitting(false);
    if (result.success) {
      closeModal();
    }
  };

  const handleUpdate = async (payload) => {
    if (!modalState.task) return;
    const taskId = modalState.task.id || modalState.task._id;
    setIsSubmitting(true);
    const result = await editTask(projectId, taskId, payload);
    setIsSubmitting(false);
    if (result.success) {
      closeModal();
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(`Delete task "${task.title}"?`);
    if (!confirmed) return;
    const id = task.id || task._id;
    await removeTask(projectId, id);
    if (selectedTask && (selectedTask.id || selectedTask._id) === id) {
      setSelectedTask(null);
    }
  };

  const handleSelectTask = async (task) => {
    setSelectedTask(task);
    setDetailLoading(true);
    try {
      await fetchTaskDetails(projectId, task.id || task._id);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubTaskToggle = async (subtask) => {
    if (!selectedTask) return;
    setSubtaskProcessing(true);
    try {
      await editSubTask(projectId, selectedTask.id || selectedTask._id, subtask.id || subtask._id, {
        isCompleted: !subtask.isCompleted,
      });
      await fetchTaskDetails(projectId, selectedTask.id || selectedTask._id);
    } finally {
      setSubtaskProcessing(false);
    }
  };

  const handleTaskStatusChange = async (task, newStatus) => {
    const id = task.id || task._id;
    setDetailLoading(true);
    try {
      await editTask(projectId, id, { status: newStatus });
      await fetchTaskDetails(projectId, id);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddSubTask = async (title) => {
    if (!selectedTask) return;
    setSubtaskProcessing(true);
    try {
      const payload = { title };
      if (user?._id || user?.id) {
        payload.assignedTo = user._id || user.id;
      }
      await addSubTask(projectId, selectedTask.id || selectedTask._id, payload);
      await fetchTaskDetails(projectId, selectedTask.id || selectedTask._id);
    } finally {
      setSubtaskProcessing(false);
    }
  };

  const handleDeleteSubTask = async (subtask) => {
    if (!selectedTask) return;
    setSubtaskProcessing(true);
    try {
      await removeSubTask(projectId, selectedTask.id || selectedTask._id, subtask.id || subtask._id);
      await fetchTaskDetails(projectId, selectedTask.id || selectedTask._id);
    } finally {
      setSubtaskProcessing(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Track progress and keep the team aligned across the project.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2 bg-input">
            <span className="text-sm text-muted-foreground">Search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              placeholder="Find tasks"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("board")}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
                view === "board" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
              aria-label="Board view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
                view === "list" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setModalState({ open: true, mode: "create", task: null })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus size={16} /> Create Task
              </button>
            )}
          </div>
        </div>
      </header>

      {taskLoading && tasks.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : taskError ? (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{taskError}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center border border-dashed border-border rounded-2xl p-10">
          <p className="text-lg font-semibold text-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Organize work by creating your first task.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalState({ open: true, mode: "create", task: null })}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      ) : view === "board" ? (
        <TaskBoard tasksByStatus={groupedTasks} onTaskClick={handleSelectTask} />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id || task._id} task={task} onClick={handleSelectTask} />
          ))}
        </div>
      )}

      {modalState.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <TaskForm
              mode={modalState.mode}
              initialValues={modalState.task || undefined}
              members={members}
              onSubmit={modalState.mode === "edit" ? handleUpdate : handleCreate}
              onCancel={closeModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Task Detail</p>
                <h3 className="text-2xl font-semibold text-foreground">{selectedTask.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      const taskToEdit = selectedTask;
                      setSelectedTask(null);
                      setModalState({ open: true, mode: "edit", task: taskToEdit });
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground"
                  >
                    Edit
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(selectedTask)}
                    className="rounded-lg border border-error px-3 py-1.5 text-sm text-error"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground"
                >
                  Close
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Status</p>
                    {/* All users (members, project_admin, super_admin) can change task status */}
                    <select
                      value={selectedTask.status || "todo"}
                      onChange={(e) => handleTaskStatusChange(selectedTask, e.target.value)}
                      disabled={detailLoading}
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Assignee</p>
                    <p className="font-medium">
                      {selectedTask.assignedTo?.username || selectedTask.assignedTo?.fullname || selectedTask.assignedTo?.email || selectedTask.assignee?.name || selectedTask.assignee?.email || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Due</p>
                    <p className="font-medium">
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString()
                        : "No date"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {selectedTask.createdAt
                        ? new Date(selectedTask.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                <SubTaskList
                  subtasks={selectedTask.subTasks || []}
                  canManage={canManage}
                  onToggle={handleSubTaskToggle}
                  onAdd={handleAddSubTask}
                  onDelete={handleDeleteSubTask}
                  isProcessing={subtaskProcessing}
                />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectTasks;
