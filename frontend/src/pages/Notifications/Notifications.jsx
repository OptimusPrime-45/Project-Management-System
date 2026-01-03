import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  CheckSquare,
  Filter,
  Loader2,
  RefreshCcw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notifications";
import { EmptyState } from "../../components/Common/EmptyState";
import PageTransition from "../../components/Common/PageTransition";
import Breadcrumb from "../../components/Common/Breadcrumb";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [processingIds, setProcessingIds] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(100);
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    if (filter === "read") {
      return notifications.filter((n) => n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAsRead = async (notificationId) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, read: true }
            : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId && n.id !== notificationId)
      );
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id || notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
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
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "project_invite":
      case "member_added":
        return "👥";
      case "task_assigned":
      case "task_updated":
        return "📋";
      case "note_added":
        return "📝";
      case "project_updated":
        return "📁";
      default:
        return "🔔";
    }
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n._id || n.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkMarkAsRead = async () => {
    setBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => markNotificationAsRead(id))
      );
      setNotifications((prev) =>
        prev.map((n) =>
          selectedIds.has(n._id || n.id) ? { ...n, read: true } : n
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} notifications?`)) return;
    setBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => deleteNotification(id))
      );
      setNotifications((prev) =>
        prev.filter((n) => !selectedIds.has(n._id || n.id))
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to delete notifications:", err);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb />
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Inbox
            </p>
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
              <Bell className="h-7 w-7 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated on project activities, task assignments, and team
              changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCheck size={16} />
                )}
                Mark all read
              </button>
            )}
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <div className="flex rounded-xl border border-border bg-card overflow-hidden">
              {[
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "read", label: "Read" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filter === option.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkMarkAsRead}
                disabled={bulkProcessing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
              >
                <Check size={14} />
                Mark read
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-error/40 bg-error/10 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/20 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading notifications...
          </div>
        )}

        {/* Notifications List */}
        {!loading && filteredNotifications.length === 0 && (
          <EmptyState
            type="notifications"
            title={
              filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications yet"
            }
            description="Notifications will appear here when there's activity in your projects"
          />
        )}

        {/* Select All */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedIds.size === filteredNotifications.length ? (
                <CheckSquare size={18} className="text-primary" />
              ) : (
                <Square size={18} />
              )}
              {selectedIds.size === filteredNotifications.length
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const id = notification._id || notification.id;
            const isProcessing = processingIds.has(id);
            const isSelected = selectedIds.has(id);

            return (
              <article
                key={id}
                className={`relative rounded-2xl border p-4 transition-all group ${
                  notification.read
                    ? "border-border bg-card hover:border-primary/30"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                } ${isProcessing ? "opacity-60" : ""} ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(id);
                    }}
                    className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-primary" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-2" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{getTimeAgo(notification.createdAt)}</span>
                          {notification.relatedProject?.name && (
                            <span className="px-2 py-0.5 rounded-full bg-muted">
                              {notification.relatedProject.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(id);
                      }}
                      disabled={isProcessing}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(id);
                    }}
                    disabled={isProcessing}
                    className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
                    title="Delete notification"
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
};

export default Notifications;
