import React, { useState, useCallback } from "react";
import {
  MoreHorizontal,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  GripVertical,
} from "lucide-react";
import Avatar from "../Common/Avatar";
import DueDateBadge from "../Common/DueDateBadge";

const statusConfig = {
  todo: {
    label: "To Do",
    color: "bg-slate-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  done: {
    label: "Done",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
};

const priorityConfig = {
  low: { color: "text-slate-500", bg: "bg-slate-500/10" },
  medium: { color: "text-amber-500", bg: "bg-amber-500/10" },
  high: { color: "text-red-500", bg: "bg-red-500/10" },
};

const TaskCard = ({ task, onEdit, onStatusChange, isDragging }) => {
  const priority = priorityConfig[task.priority?.toLowerCase()] || priorityConfig.low;

  return (
    <div
      draggable
      className={`group bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-primary/30 ${
        isDragging ? "opacity-50 rotate-2 scale-105" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
            {task.priority || "Low"}
          </span>
        </div>
        <button className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>

      <h4 className="font-medium text-foreground mb-2 line-clamp-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        {task.dueDate ? (
          <DueDateBadge dueDate={task.dueDate} size="xs" />
        ) : (
          <span className="text-xs text-muted-foreground">No due date</span>
        )}
        
        {task.assignedTo && (
          <Avatar
            src={task.assignedTo.avatar?.url}
            name={task.assignedTo.fullname || task.assignedTo.username}
            email={task.assignedTo.email}
            size="xs"
          />
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tasks, onTaskStatusChange, onTaskEdit }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = statusConfig[status] || statusConfig.todo;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onTaskStatusChange) {
      onTaskStatusChange(taskId, status);
    }
  };

  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px]">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-xl ${config.bgColor} border ${config.borderColor} border-b-0`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          <h3 className="font-semibold text-foreground">{config.label}</h3>
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 p-3 space-y-3 rounded-b-xl border ${config.borderColor} bg-muted/30 min-h-[400px] transition-colors ${
          isDragOver ? "bg-primary/5 border-primary/50" : ""
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <CheckCircle2 size={24} className="mb-2 opacity-50" />
            <p className="text-sm">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("taskId", task._id);
              }}
            >
              <TaskCard task={task} onEdit={onTaskEdit} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TaskKanban = ({ tasks = [], onTaskStatusChange, onTaskEdit }) => {
  const columns = ["todo", "in_progress", "done"];

  const tasksByStatus = columns.reduce((acc, status) => {
    acc[status] = tasks.filter(
      (task) => (task.status?.toLowerCase().replace(" ", "_") || "todo") === status
    );
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
          onTaskStatusChange={onTaskStatusChange}
          onTaskEdit={onTaskEdit}
        />
      ))}
    </div>
  );
};

export default TaskKanban;
