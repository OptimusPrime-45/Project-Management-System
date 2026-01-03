import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Crown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../Common/ThemeToggle";
import { getNotifications, markAllNotificationsAsRead } from "../../api/notifications";

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(20);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (user) {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllAsRead = async () => {
    setLoadingNotifications(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleLogout = () => {
    logout();
    console.log("Logging out...");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border h-16 px-4 flex items-center justify-between transition-colors duration-300 shadow-sm">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-foreground-secondary hover:bg-background-secondary focus:outline-none transition-colors"
        >
          <Menu size={24} />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
            P
          </div>
          <span className="text-xl font-bold text-foreground hidden sm:block">
            ProjectFlow
          </span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg text-foreground-secondary hover:bg-background-secondary transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsNotificationsOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification._id || notification.id}
                        className={`px-4 py-3 border-b border-border hover:bg-background-secondary transition-colors cursor-pointer ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          if (notification.link) {
                            navigate(notification.link);
                          }
                          setIsNotificationsOpen(false);
                        }}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Bell size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No notifications
                      </p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-border flex items-center justify-between gap-2">
                    <button 
                      onClick={handleMarkAllAsRead}
                      disabled={loadingNotifications || unreadCount === 0}
                      className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingNotifications ? "Marking..." : "Mark all as read"}
                    </button>
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs text-primary hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-background-secondary transition-colors focus:outline-none"
          >
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.username || "User"}
                className="w-8 h-8 rounded-full object-cover border border-primary/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-foreground">
              {user?.username || "User"}
            </span>
            <ChevronDown
              size={16}
              className="text-foreground-secondary hidden md:block"
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-border md:hidden">
                  <p className="text-sm font-medium text-foreground">
                    {user?.username || "User"}
                  </p>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background-secondary transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User size={16} /> Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background-secondary transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings size={16} /> Settings
                </Link>
                {user?.isSuperAdmin && (
                  <Link
                    to="/super-admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background-secondary transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Crown size={16} /> Super Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 text-left transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
