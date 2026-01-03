import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderOpen, User, Crown, X, Settings, Bell, CheckCircle2, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Sidebar = ({ isOpen = false, isDesktopOpen = true, closeSidebar = () => {} }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", to: "/projects", icon: FolderOpen },
    { label: "My Tasks", to: "/my-tasks", icon: CheckCircle2 },
    { label: "Notifications", to: "/notifications", icon: Bell },
    { label: "Profile", to: "/profile", icon: User },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  if (user?.isSuperAdmin) {
    navItems.push({
      label: "Super Admin Panel",
      to: "/super-admin",
      icon: Crown,
    });
  }

  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const userRole = isSuperAdmin ? "super admin" : "member";
  const RoleIcon = isSuperAdmin ? Crown : User;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-card border-r border-border text-foreground transform transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:h-full shadow-lg lg:shadow-none
          ${!isDesktopOpen && "lg:w-0 lg:border-none lg:overflow-hidden"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
          <span className="font-bold text-foreground">Menu</span>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg text-foreground-secondary hover:bg-background-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && closeSidebar()}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-background-secondary"}`}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-background-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </button>

          {/* Role Badge */}
          <div className="bg-background-secondary rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <RoleIcon size={16} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Current Role</p>
              <p className="text-sm font-medium text-foreground capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;