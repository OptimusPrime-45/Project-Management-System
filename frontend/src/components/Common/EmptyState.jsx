import React from "react";
import {
  FileQuestion,
  FolderOpen,
  ClipboardList,
  StickyNote,
  Users,
  Search,
  Bell,
} from "lucide-react";

const illustrations = {
  projects: FolderOpen,
  tasks: ClipboardList,
  notes: StickyNote,
  members: Users,
  search: Search,
  notifications: Bell,
  default: FileQuestion,
};

export const EmptyState = ({
  type = "default",
  title,
  description,
  action,
  actionLabel,
  className = "",
}) => {
  const Icon = illustrations[type] || illustrations.default;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
        <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-6">
          <Icon size={64} className="text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title || "No items found"}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}

      {action && actionLabel && (
        <button
          onClick={action}
          className="btn-hover gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
