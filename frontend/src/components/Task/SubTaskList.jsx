import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const SubTaskList = ({
	subtasks = [],
	canManage = false,
	onToggle,
	onAdd,
	onDelete,
	isProcessing = false,
}) => {
	const [newTitle, setNewTitle] = useState("");

	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmed = newTitle.trim();
		if (!trimmed) return;
		onAdd?.(trimmed);
		setNewTitle("");
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
					Subtasks
				</h4>
				{subtasks.length > 0 && (
					<span className="text-xs text-muted-foreground">
						{subtasks.filter((task) => task.isCompleted).length} of {subtasks.length} complete
					</span>
				)}
			</div>

			<ul className="space-y-2">
				{subtasks.length === 0 && (
					<li className="text-sm text-muted-foreground">No subtasks yet.</li>
				)}

				{subtasks.map((subtask) => (
					<li
						key={subtask.id || subtask._id}
						className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
					>
						<label className="flex items-center gap-3 flex-1 cursor-pointer">
							<input
								type="checkbox"
								className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
								checked={Boolean(subtask.isCompleted)}
								onChange={() => onToggle?.(subtask)}
							/>
							<span className={`text-sm ${subtask.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
								{subtask.title}
							</span>
						</label>
						{canManage && (
							<button
								type="button"
								onClick={() => onDelete?.(subtask)}
								className="p-1.5 rounded-lg text-error hover:bg-error/10"
							>
								<Trash2 size={16} />
							</button>
						)}
					</li>
				))}
			</ul>

			{canManage && (
				<form onSubmit={handleSubmit} className="flex items-center gap-2">
					<div className="flex-1 rounded-xl border border-border bg-input px-3 py-2">
						<input
							type="text"
							value={newTitle}
							onChange={(event) => setNewTitle(event.target.value)}
							placeholder="Add a subtask"
							className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
						/>
					</div>
					<button
						type="submit"
						disabled={isProcessing}
						className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-60"
					>
						<Plus size={16} /> Add
					</button>
				</form>
			)}
		</div>
	);
};

export default SubTaskList;
