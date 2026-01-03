import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FolderOpen,
  CheckSquare,
  StickyNote,
  Users,
  Settings,
  Command,
  ArrowRight,
  X,
  Plus,
  LayoutDashboard,
  Bell,
  Crown,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const actions = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/dashboard"),
      category: "Navigation",
      keywords: ["dashboard", "home", "main"],
    },
    {
      id: "projects",
      label: "View All Projects",
      icon: FolderOpen,
      action: () => navigate("/projects"),
      category: "Navigation",
      keywords: ["projects", "view", "list", "all"],
    },
    {
      id: "my-tasks",
      label: "View My Tasks",
      icon: CheckSquare,
      action: () => navigate("/my-tasks"),
      category: "Navigation",
      keywords: ["tasks", "view", "my", "assigned", "todo"],
    },
    {
      id: "notifications",
      label: "View Notifications",
      icon: Bell,
      action: () => navigate("/notifications"),
      category: "Navigation",
      keywords: ["notifications", "alerts", "messages"],
    },
    {
      id: "profile",
      label: "Go to Profile",
      icon: Users,
      action: () => navigate("/profile"),
      category: "Navigation",
      keywords: ["profile", "account", "user", "me"],
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: Settings,
      action: () => navigate("/settings"),
      category: "Navigation",
      keywords: ["settings", "preferences", "configuration"],
    },
    ...(user?.isSuperAdmin ? [{
      id: "super-admin",
      label: "Super Admin Panel",
      icon: Crown,
      action: () => navigate("/super-admin"),
      category: "Navigation",
      keywords: ["admin", "super", "panel", "management"],
    }] : []),
    {
      id: "toggle-theme",
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: theme === "dark" ? Sun : Moon,
      action: () => toggleTheme(),
      category: "Actions",
      keywords: ["theme", "dark", "light", "mode", "toggle"],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredActions = actions.filter((action) => {
    const searchTerm = query.toLowerCase();
    return (
      action.label.toLowerCase().includes(searchTerm) ||
      action.category.toLowerCase().includes(searchTerm) ||
      action.keywords.some((keyword) => keyword.includes(searchTerm))
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredActions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && filteredActions[selectedIndex]) {
      e.preventDefault();
      executeAction(filteredActions[selectedIndex]);
    }
  };

  const executeAction = (action) => {
    action.action();
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const groupedActions = filteredActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {});

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4 animate-slide-down">
        <div className="bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-card-border">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search for actions or pages..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {filteredActions.length > 0 ? (
              Object.entries(groupedActions).map(([category, actions]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    {category}
                  </div>
                  {actions.map((action, idx) => {
                    const globalIndex = filteredActions.indexOf(action);
                    const Icon = action.icon;
                    const isSelected = selectedIndex === globalIndex;

                    return (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                          isSelected
                            ? "bg-primary/10 border-l-4 border-primary"
                            : "border-l-4 border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isSelected
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {action.label}
                          </span>
                        </div>
                        {isSelected && (
                          <ArrowRight className="h-4 w-4 text-primary animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-card-border bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border border-card-border font-mono">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border border-card-border font-mono">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border border-card-border font-mono">
                  ESC
                </kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>+</span>
              <kbd className="px-2 py-1 rounded bg-background border border-card-border font-mono">
                K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
