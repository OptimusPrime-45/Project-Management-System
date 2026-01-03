import React from "react";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";

const ProjectSettings = ({ project, onEdit, onDelete }) => {
	if (!project) return null;

	const createdAt = project.createdAt
		? new Date(project.createdAt).toLocaleDateString()
		: "Unknown";

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-border bg-card p-6 space-y-4">
				<div>
					<h3 className="text-xl font-semibold text-foreground">General</h3>
					<p className="text-sm text-muted-foreground">
						Update the core project details.
					</p>
				</div>
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">
							Project Name
						</dt>
						<dd className="text-lg font-semibold text-foreground">
							{project.name}
						</dd>
					</div>
					<div>
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">
							Created
						</dt>
						<dd className="text-lg font-semibold text-foreground">{createdAt}</dd>
					</div>
				</dl>
				<div>
					<dt className="text-xs uppercase tracking-wide text-muted-foreground">
						Description
					</dt>
					<p className="mt-1 text-sm text-foreground">
						{project.description || "No description provided."}
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
					>
						<Pencil size={16} /> Edit Project
					</button>
				</div>
			</section>

			<section className="rounded-2xl border border-error/40 bg-error/5 p-6 space-y-4">
				<div className="flex items-center gap-3">
					<AlertTriangle className="text-error" size={20} />
					<div>
						<h3 className="text-lg font-semibold text-error">Danger Zone</h3>
						<p className="text-sm text-error/80">
							Deleting a project removes tasks, notes, and settings permanently.
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onDelete}
					className="inline-flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error hover:bg-error/10"
				>
					<Trash2 size={16} /> Delete Project
				</button>
			</section>
		</div>
	);
};

export default ProjectSettings;
