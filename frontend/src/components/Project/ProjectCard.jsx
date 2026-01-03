import React from "react";
import { Users, Eye, Pencil, Trash2, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const roleColors = {
	admin: "bg-primary/10 text-primary border-primary/20",
	"project-admin": "bg-secondary/10 text-secondary border-secondary/20",
	member: "bg-muted text-foreground border-border",
	"super_admin": "gradient-primary text-primary-foreground border-none",
	"project_admin": "gradient-secondary text-secondary-foreground border-none",
};

const ProjectCard = ({
	project,
	onView,
	onEdit,
	onDelete,
	showActions = true,
}) => {
	if (!project) return null;

	const projectId = project.id ?? project._id ?? "";
	const memberCount = project.members?.length ?? project.memberCount ?? 0;
	const currentRole = (project.role || project.currentUserRole || "member").toLowerCase();
	
	// Calculate progress
	const totalTasks = project.stats?.totalTasks || project.taskCount || 0;
	const completedTasks = project.stats?.doneTasks || project.completedTasks || 0;
	const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
	
	const isCompleted = project.isCompleted;

	return (
		<article className="card-hover bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
			{/* Gradient Overlay */}
			<div className="absolute inset-0 gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
			
			{/* Content */}
			<div className="relative z-10 space-y-4">
				<header className="flex items-start justify-between gap-4">
					<div className="flex-1 space-y-2">
						<div className="flex items-center gap-2 flex-wrap">
							<p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
								{project.key || project.code || `#${projectId?.slice(-6)}`}
							</p>
							{isCompleted && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20">
									<CheckCircle2 size={12} />
									Completed
								</span>
							)}
						</div>
						<h3 className="text-xl font-bold leading-tight text-foreground line-clamp-1">
							{project.name}
						</h3>
						<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
							{project.description || "No description provided."}
						</p>
					</div>

					<span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap ${roleColors[currentRole] || roleColors.member}`}>
						{project.role?.replace('_', ' ').toUpperCase() || project.currentUserRole || "Member"}
					</span>
				</header>

				{/* Stats */}
				<div className="grid grid-cols-2 gap-3">
					<div className="flex items-center gap-2 text-sm">
						<div className="p-2 rounded-lg bg-primary/10">
							<Users size={16} className="text-primary" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Members</p>
							<p className="font-semibold text-foreground">{memberCount}</p>
						</div>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<div className="p-2 rounded-lg bg-secondary/10">
							<CheckCircle2 size={16} className="text-secondary" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Tasks</p>
							<p className="font-semibold text-foreground">{completedTasks}/{totalTasks}</p>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div>
					<div className="flex items-center justify-between text-xs font-medium mb-2">
						<span className="text-muted-foreground">Progress</span>
						<span className="text-primary font-bold">{progress}%</span>
					</div>
					<div className="h-2.5 bg-muted rounded-full overflow-hidden">
						<div 
							className={`h-full rounded-full transition-all duration-500 ${
								progress === 100 ? 'gradient-success' : 'gradient-primary'
							}`}
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{/* Actions */}
				<footer className="flex items-center gap-2 pt-2">
					<button
						type="button"
						onClick={() => onView?.(project)}
						className="flex-1 btn-hover inline-flex items-center justify-center gap-2 rounded-lg gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg"
					>
						<Eye size={16} />
						View Project
					</button>
					{onEdit && (
						<button
							type="button"
							onClick={() => onEdit(project)}
							className="btn-hover inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground hover:bg-muted/50"
						>
							<Pencil size={16} />
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(project)}
							className="btn-hover inline-flex items-center justify-center rounded-lg border border-error/30 bg-error/5 px-3 py-2.5 text-sm text-error hover:bg-error/10"
						>
							<Trash2 size={16} />
						</button>
					)}
				</footer>
			</div>
		</article>
	);
};

export default ProjectCard;
