import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

const defaultValues = {
	title: "",
	content: "",
};

const NoteForm = ({
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

	const title = useMemo(() => (mode === "edit" ? "Edit Note" : "Create Note"), [mode]);
	const ctaLabel = mode === "edit" ? "Save Note" : "Create Note";

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (error) setError(null);
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!formData.content.trim()) {
			setError("Note content is required.");
			return;
		}

		onSubmit?.({
			title: formData.title?.trim() || undefined,
			content: formData.content.trim(),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4" aria-label={`${title} form`}>
			<div>
				<h3 className="text-lg font-semibold text-foreground">{title}</h3>
				<p className="text-sm text-muted-foreground">
					{mode === "edit"
						? "Update the note to reflect the latest project decisions."
						: "Capture insights, meeting notes, or action items for the team."}
				</p>
			</div>

			{error && (
				<div className="p-3 rounded-lg border border-error/40 bg-error/10 text-sm text-error">
					{error}
				</div>
			)}

			<label className="block space-y-1">
				<span className="text-sm font-medium text-foreground">Title (optional)</span>
				<input
					type="text"
					name="title"
					value={formData.title}
					onChange={handleChange}
					placeholder="Sprint Review Takeaways"
					className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</label>

			<label className="block space-y-1">
				<span className="text-sm font-medium text-foreground">Content</span>
				<textarea
					name="content"
					value={formData.content}
					onChange={handleChange}
					rows={8}
					placeholder="Add meeting notes, decisions, or links..."
					className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

export default NoteForm;
