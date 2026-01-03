import React from "react";
import { Clock, AlertTriangle, Calendar, CalendarCheck } from "lucide-react";

const DueDateBadge = ({ dueDate, showIcon = true, size = "sm" }) => {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  const diffTime = dueDay - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status, label, Icon, colorClasses;

  if (diffDays < 0) {
    // Overdue
    status = "overdue";
    label = diffDays === -1 ? "1 day overdue" : `${Math.abs(diffDays)} days overdue`;
    Icon = AlertTriangle;
    colorClasses = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  } else if (diffDays === 0) {
    // Due today
    status = "today";
    label = "Due today";
    Icon = Clock;
    colorClasses = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  } else if (diffDays === 1) {
    // Due tomorrow
    status = "tomorrow";
    label = "Due tomorrow";
    Icon = Calendar;
    colorClasses = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
  } else if (diffDays <= 7) {
    // Due this week
    status = "this-week";
    label = `Due in ${diffDays} days`;
    Icon = Calendar;
    colorClasses = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  } else {
    // Due later
    status = "later";
    label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    Icon = CalendarCheck;
    colorClasses = "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
  }

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-0.5",
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClasses} ${sizeClasses[size]}`}
      title={`Due: ${due.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{label}</span>
    </span>
  );
};

export default DueDateBadge;
