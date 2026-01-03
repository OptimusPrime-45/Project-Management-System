import React from "react";
import {
  CheckCircle2,
  UserPlus,
  FileText,
  MessageSquare,
  Edit,
  Trash2,
  FolderPlus,
  Clock,
  ArrowRight,
} from "lucide-react";
import Avatar from "../Common/Avatar";

const activityIcons = {
  task_created: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  task_completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  task_updated: { icon: Edit, color: "text-blue-500", bg: "bg-blue-500/10" },
  task_deleted: { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10" },
  member_added: { icon: UserPlus, color: "text-purple-500", bg: "bg-purple-500/10" },
  member_removed: { icon: UserPlus, color: "text-orange-500", bg: "bg-orange-500/10" },
  note_created: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  note_updated: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  comment_added: { icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  project_created: { icon: FolderPlus, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  project_updated: { icon: Edit, color: "text-blue-500", bg: "bg-blue-500/10" },
  default: { icon: Clock, color: "text-slate-500", bg: "bg-slate-500/10" },
};

const getTimeAgo = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ActivityItem = ({ activity, isLast }) => {
  const config = activityIcons[activity.type] || activityIcons.default;
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
          <Icon size={14} />
        </div>
        {!isLast && <div className="w-0.5 h-full bg-border mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              {activity.user && (
                <span className="font-medium">{activity.user.fullname || activity.user.username}</span>
              )}{" "}
              <span className="text-muted-foreground">{activity.action}</span>
              {activity.target && (
                <>
                  {" "}
                  <span className="font-medium text-foreground">{activity.target}</span>
                </>
              )}
            </p>
            {activity.details && (
              <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {getTimeAgo(activity.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ActivityTimeline = ({ activities = [], maxItems = 10, showViewAll = false, onViewAll }) => {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {displayActivities.map((activity, index) => (
        <ActivityItem
          key={activity._id || index}
          activity={activity}
          isLast={index === displayActivities.length - 1}
        />
      ))}
      {showViewAll && activities.length > maxItems && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
        >
          View all activity
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default ActivityTimeline;
