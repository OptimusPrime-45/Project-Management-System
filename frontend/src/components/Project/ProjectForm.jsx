import React, { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";

const defaultValues = {
    name: "",
    description: "",
};

const ProjectForm = ({
    mode = "create",
    initialValues = defaultValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}) => {
    const [formData, setFormData] = useState({
        ...defaultValues,
        ...initialValues,
    });
    const [error, setError] = useState(null);

    const title = useMemo(
        () => (mode === "edit" ? "Edit Project" : "Create Project"),
        [mode]
    );

    const ctaLabel = mode === "edit" ? "Save Changes" : "Create Project";

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!formData.name?.trim()) {
            setError("Project name is required.");
            return;
        }

        onSubmit?.({
            name: formData.name.trim(),
            description: formData.description?.trim() || "",
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-card"
            aria-label={`${title} form`}
        >
            <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">
                    {mode === "edit"
                        ? "Update the project details below."
                        : "Provide a name and description to get started."}
                </p>
            </div>

            {error && (
                <div className="p-3 rounded-lg border border-error/40 bg-error/10 text-sm text-error">
                    {error}
                </div>
            )}

            <label className="block space-y-1">
                <span className="text-sm font-medium text-foreground">Project Name</span>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Website Redesign"
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
                    placeholder="Briefly describe the project goals and scope."
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            </label>

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
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} {ctaLabel}
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;