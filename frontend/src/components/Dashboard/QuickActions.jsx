import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FolderPlus,
  UserPlus,
  FileText,
  Search,
  Command,
} from "lucide-react";

const QuickActions = ({ onCreateProject, onCreateTask }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: "create-project",
      label: "New Project",
      icon: FolderPlus,
      color: "bg-blue-500 hover:bg-blue-600",
      action: onCreateProject || (() => navigate("/projects")),
    },
    {
      id: "create-task",
      label: "New Task",
      icon: Plus,
      color: "bg-emerald-500 hover:bg-emerald-600",
      action: onCreateTask || (() => navigate("/my-tasks")),
    },
    {
      id: "add-note",
      label: "Add Note",
      icon: FileText,
      color: "bg-amber-500 hover:bg-amber-600",
      action: () => navigate("/projects"),
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      color: "bg-purple-500 hover:bg-purple-600",
      shortcut: "⌘K",
      action: () => {
        // Trigger command palette via keyboard event
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
      },
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Get things done faster</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          <Command size={12} />
          <span>+</span>
          <kbd className="font-mono">K</kbd>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${action.color} text-white transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg`}
            >
              <Icon size={24} />
              <span className="text-sm font-medium">{action.label}</span>
              {action.shortcut && (
                <span className="text-xs opacity-75">{action.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
