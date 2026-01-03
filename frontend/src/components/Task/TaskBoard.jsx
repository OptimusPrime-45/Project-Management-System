import React from "react";
import TaskCard from "./TaskCard";

const columns = [
	{ key: "TODO", title: "To Do" },
	{ key: "IN_PROGRESS", title: "In Progress" },
	{ key: "DONE", title: "Done" },
];

const TaskBoard = ({ tasksByStatus, onTaskClick }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{columns.map((column) => {
				const tasks = tasksByStatus[column.key] || [];
				return (
					<section key={column.key} className="bg-background-secondary rounded-2xl border border-border p-4 space-y-3">
						<header className="flex items-center justify-between">
							<span className="text-sm font-semibold text-foreground">
								{column.title}
							</span>
							<span className="text-xs text-muted-foreground">{tasks.length}</span>
						</header>
						<div className="space-y-3 min-h-[120px]">
							{tasks.length === 0 && (
								<p className="text-xs text-muted-foreground">No tasks.</p>
							)}
							{tasks.map((task) => (
								<TaskCard key={task.id || task._id} task={task} onClick={onTaskClick} />
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
};

export default TaskBoard;
