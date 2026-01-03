import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

const defaultValues = {
  title: "",
  description: "",
  status: "todo",
  assigneeId: "",
  dueDate: "",
};

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const TaskForm = ({
  mode = "create",
  initialValues = defaultValues,
  members = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    ...defaultValues,
    ...initialValues,
    status: (
      initialValues.status ||
      defaultValues.status ||
      "todo"
    ).toLowerCase(),
    assigneeId:
      initialValues.assigneeId ||
      initialValues.assignee?._id ||
      initialValues.assignedTo?._id ||
      initialValues.assignee?.id ||
      initialValues.assignedTo ||
      "",
  });
  const [error, setError] = useState(null);

  const title = useMemo(
    () => (mode === "edit" ? "Edit Task" : "Create Task"),
    [mode]
  );
  const ctaLabel = mode === "edit" ? "Save Task" : "Create Task";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      setError("Task title is required.");
      return;
    }

    onSubmit?.({
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      status: formData.status,
      assignedTo: formData.assigneeId || undefined,
      dueDate: formData.dueDate || undefined,
    });
  };

  const formatDateValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-label={`${title} form`}
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {mode === "edit"
            ? "Update the task information to keep progress accurate."
            : "Provide details so your team knows what to deliver."}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-error/40 bg-error/10 text-sm text-error">
          {error}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-foreground">Title</span>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Finalize sprint scope"
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Add context, acceptance criteria, or links."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Assignee</span>
          <select
            name="assigneeId"
            value={formData.assigneeId}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option
                key={
                  member.userId || member.user?._id || member._id || member.id
                }
                value={
                  member.userId || member.user?._id || member._id || member.id
                }
              >
                {member.username ||
                  member.fullname ||
                  member.fullName ||
                  member.name ||
                  member.email}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Due Date</span>
          <input
            type="date"
            name="dueDate"
            value={formatDateValue(formData.dueDate)}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
          {ctaLabel}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
