import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels = {
  dashboard: "Dashboard",
  projects: "Projects",
  "my-tasks": "My Tasks",
  notifications: "Notifications",
  profile: "Profile",
  settings: "Settings",
  "super-admin": "Super Admin",
  users: "Users",
};

const Breadcrumb = ({ customLabels = {} }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumb on dashboard (home)
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === "dashboard")) {
    return null;
  }

  const getBreadcrumbLabel = (segment, index) => {
    // Check custom labels first (for dynamic routes like project names)
    if (customLabels[segment]) {
      return customLabels[segment];
    }
    // Check predefined route labels
    if (routeLabels[segment]) {
      return routeLabels[segment];
    }
    // If it looks like an ID (MongoDB ObjectId), show ellipsis
    if (segment.length === 24 && /^[a-f0-9]+$/i.test(segment)) {
      return "...";
    }
    // Fallback: capitalize the segment
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          >
            <Home size={14} />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>
        {pathnames.map((segment, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const label = getBreadcrumbLabel(segment, index);

          return (
            <li key={routeTo} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-muted-foreground/50" />
              {isLast ? (
                <span className="font-medium text-foreground px-1">{label}</span>
              ) : (
                <Link
                  to={routeTo}
                  className="hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
