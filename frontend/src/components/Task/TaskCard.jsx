import React from "react";
import { Clock3, User, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

const statusStyles = {
	TODO: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
	IN_PROGRESS: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
	DONE: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
};

const statusLabels = {
	TODO: "To Do",
	IN_PROGRESS: "In Progress",
	DONE: "Done",
};

const priorityColors = {
	high: "border-l-error shadow-error/10",
	medium: "border-l-warning shadow-warning/10",
	low: "border-l-slate-300 dark:border-l-slate-600 shadow-slate-100 dark:shadow-slate-800",
};

const priorityIcons = {
	high: { color: "text-error", bg: "bg-error/10" },
	medium: { color: "text-warning", bg: "bg-warning/10" },
	low: { color: "text-muted-foreground", bg: "bg-muted" },
};

const TaskCard = ({ task, onClick }) => {
	if (!task) return null;

	const subTasks = task.subTasks || [];
	const completedSubTasks = subTasks.filter((item) => item.isCompleted).length;
	const totalSubTasks = subTasks.length;
	const progress = totalSubTasks ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0;
	const status = (task.status || "TODO").toUpperCase();
	const priority = (task.priority || "low").toLowerCase();
	const priorityStyle = priorityIcons[priority] || priorityIcons.low;
	
	// Calculate days until due
	const daysUntilDue = task.dueDate 
		? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
		: null;
	const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
	const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

	return (
		<button
			type="button"
			onClick={() => onClick?.(task)}
			className={`w-full text-left bg-card border border-card-border rounded-xl p-5 shadow-sm hover:shadow-lg transition-all card-hover border-l-4 ${priorityColors[priority] || priorityColors.low}`}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="flex items-center gap-2 flex-1 min-w-0">
					<div className={`p-1.5 rounded-md ${priorityStyle.bg}`}>
						<TrendingUp size={14} className={priorityStyle.color} />
					</div>
					<p className="text-xs font-mono uppercase tracking-wide text-muted-foreground truncate">
						{task.key || task.code || `#${task._id?.slice(-6)}`}
					</p>
				</div>
				<span className={`px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${statusStyles[status] || statusStyles.TODO}`}>
					{statusLabels[status] || status}
				</span>
			</div>

			{/* Title & Description */}
			<h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2 leading-tight">
				{task.title}
			</h3>
			{task.description && (
				<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
					{task.description}
				</p>
			)}

			{/* Meta Information */}
			<div className="flex flex-wrap items-center gap-3 text-xs mb-4">
				{(task.assignedTo || task.assignee) && (
					<div className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-md">
						{task.assignedTo?.avatar?.url ? (
							<img 
								src={task.assignedTo.avatar.url} 
								alt={task.assignedTo.username}
								className="w-4 h-4 rounded-full object-cover"
							/>
						) : (
							<div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
								<User size={10} className="text-primary" />
							</div>
						)}
						<span className="font-medium text-foreground">
							{task.assignedTo?.username || task.assignedTo?.email || task.assignee?.name || "Unassigned"}
						</span>
					</div>
				)}
				{task.dueDate && (
					<div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${
						isOverdue ? 'bg-error/10 text-error' : 
						isDueSoon ? 'bg-warning/10 text-warning' : 
						'bg-muted text-muted-foreground'
					}`}>
						<Clock3 size={12} />
						<span className="font-medium">
							{isOverdue ? `${Math.abs(daysUntilDue)}d overdue` :
							 isDueSoon ? `${daysUntilDue}d left` :
							 new Date(task.dueDate).toLocaleDateString()}
						</span>
					</div>
				)}
			</div>

			{/* Subtasks Progress */}
			{totalSubTasks > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs font-medium">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<CheckCircle2 size={12} />
							<span>Subtasks</span>
						</div>
						<span className="text-primary font-bold">
							{completedSubTasks}/{totalSubTasks} ({progress}%)
						</span>
					</div>
					<div className="h-2 bg-muted rounded-full overflow-hidden">
						<div 
							className={`h-full rounded-full transition-all duration-500 ${
								progress === 100 ? 'gradient-success' : 'gradient-primary'
							}`}
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			)}

			{/* Priority Badge (if high) */}
			{priority === 'high' && (
				<div className="mt-3 flex items-center gap-1.5 text-error text-xs font-medium">
					<AlertCircle size={12} />
					<span>High Priority</span>
				</div>
			)}
		</button>
	);
};

export default TaskCard;

