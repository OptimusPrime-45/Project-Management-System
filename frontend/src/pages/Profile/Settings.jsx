import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Loader2,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Keyboard,
  Mail,
  MessageSquare,
  CheckCircle2,
  FolderOpen,
  UserPlus,
} from "lucide-react";
import { changePassword } from "../../api/auth";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

const THEME_STORAGE_KEY = "pf-theme-choice";
const NOTIFICATION_STORAGE_KEY = "pf-notifications";
const NOTIFICATION_PREFS_KEY = "pf-notification-prefs";

const Settings = () => {
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const { profile, fetchProfile } = useUser();

  const [accountPrefs, setAccountPrefs] = useState({
    notifications: true,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    taskAssigned: true,
    taskCompleted: true,
    projectUpdates: true,
    memberJoined: true,
    mentions: true,
  });
  const [themeChoice, setThemeChoice] = useState("system");
  const [accountFeedback, setAccountFeedback] = useState(null);
  const [appearanceFeedback, setAppearanceFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const detectSystemTheme = () => {
    if (typeof window === "undefined" || !window.matchMedia) return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  useEffect(() => {
    const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const storedThemeChoice = localStorage.getItem(THEME_STORAGE_KEY);
    const storedNotificationPrefs = localStorage.getItem(
      NOTIFICATION_PREFS_KEY
    );

    setAccountPrefs({
      notifications: storedNotifications
        ? storedNotifications === "true"
        : true,
    });

    if (storedNotificationPrefs) {
      try {
        setNotificationPrefs(JSON.parse(storedNotificationPrefs));
      } catch (e) {
        // Use defaults
      }
    }

    if (storedThemeChoice) {
      setThemeChoice(storedThemeChoice);
      const nextTheme =
        storedThemeChoice === "system"
          ? detectSystemTheme()
          : storedThemeChoice;
      setThemeMode(nextTheme);
    }
  }, [setThemeMode]);

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [fetchProfile, profile]);

  const handleAccountToggle = () => {
    setAccountPrefs((prev) => ({
      ...prev,
      notifications: !prev.notifications,
    }));
  };

  const handleAccountSubmit = (event) => {
    event.preventDefault();
    setSavingAccount(true);
    localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      String(accountPrefs.notifications)
    );
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(notificationPrefs));
    setTimeout(() => {
      setAccountFeedback({ type: "success", text: "Preferences saved" });
      setSavingAccount(false);
    }, 400);
  };

  const handleNotificationPrefToggle = (key) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationOptions = [
    { key: "taskAssigned", label: "Task assigned to me", icon: CheckCircle2 },
    { key: "taskCompleted", label: "Task completed", icon: CheckCircle2 },
    { key: "projectUpdates", label: "Project updates", icon: FolderOpen },
    { key: "memberJoined", label: "New member joined", icon: UserPlus },
    { key: "mentions", label: "Mentions & comments", icon: MessageSquare },
  ];

  const keyboardShortcuts = [
    { keys: ["Ctrl", "K"], action: "Open command palette" },
    { keys: ["Esc"], action: "Close dialogs/modals" },
    { keys: ["↑", "↓"], action: "Navigate lists" },
    { keys: ["Enter"], action: "Select/confirm" },
  ];

  const applyThemeChoice = (choice) => {
    setThemeChoice(choice);
    localStorage.setItem(THEME_STORAGE_KEY, choice);

    if (choice === "system") {
      const systemTheme = detectSystemTheme();
      setThemeMode(systemTheme);
      setAppearanceFeedback({
        type: "info",
        text: `Following system preference (${systemTheme})`,
      });
      return;
    }

    if (choice !== theme) {
      setThemeMode(choice);
    } else {
      setAppearanceFeedback({
        type: "info",
        text: `Already using ${choice} mode`,
      });
      return;
    }

    setAppearanceFeedback({
      type: "success",
      text: `Theme switched to ${choice}`,
    });
  };

  const handleQuickToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    toggleTheme();
    setThemeChoice(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setAppearanceFeedback({
      type: "success",
      text: `Theme switched to ${nextTheme}`,
    });
  };

  const themeOptions = useMemo(
    () => [
      { id: "light", label: "Light", icon: Sun },
      { id: "dark", label: "Dark", icon: Moon },
      { id: "system", label: "System", icon: Monitor },
    ],
    []
  );

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordFeedback({ type: "error", text: "All fields are required" });
      return;
    }

    if (passwords.next.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "New password must be at least 8 characters",
      });
      return;
    }

    if (passwords.next !== passwords.confirm) {
      setPasswordFeedback({ type: "error", text: "Passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await changePassword({
        oldPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswordFeedback({
        type: "success",
        text: response?.message || "Password updated",
      });
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (error) {
      setPasswordFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Preferences
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground">
          Control notifications, appearance, and account security from a single
          place.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Bell size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Account Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                Notification and language preferences
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleAccountSubmit}>
            <label className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <p className="font-medium text-foreground">
                  Email notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  Stay updated when projects change
                </p>
              </div>
              <button
                type="button"
                onClick={handleAccountToggle}
                role="switch"
                aria-checked={accountPrefs.notifications}
                className={`relative h-6 w-12 rounded-full transition-colors ${
                  accountPrefs.notifications ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-transform ${
                    accountPrefs.notifications
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            {accountFeedback && (
              <div
                className={`rounded-xl border px-3 py-2 text-sm ${
                  accountFeedback.type === "success"
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {accountFeedback.text}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              disabled={savingAccount}
            >
              {savingAccount && <Loader2 size={16} className="animate-spin" />}{" "}
              Save Preferences
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-secondary/10 p-3 text-secondary">
              <Sun size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose light, dark, or follow your device
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = themeChoice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => applyThemeChoice(option.id)}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:border-primary ${
                    isActive ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <span
                    className={`rounded-xl p-2 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.id === "system"
                      ? "Match OS preference"
                      : `Force ${option.label.toLowerCase()} mode`}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <div
              className={`mt-2 rounded-xl p-4 text-sm shadow-inner transition-colors ${
                theme === "dark"
                  ? "bg-linear-to-br from-gray-900 to-gray-800 text-white"
                  : "bg-linear-to-br from-white to-slate-100 text-gray-700"
              }`}
            >
              <div className="font-semibold">
                {theme === "dark" ? "Night" : "Day"} mode
              </div>
              <p className="text-xs opacity-80">
                This is how UI surfaces will look.
              </p>
            </div>
          </div>

          {appearanceFeedback && (
            <p
              className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                appearanceFeedback.type === "success"
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {appearanceFeedback.text}
            </p>
          )}

          <button
            type="button"
            onClick={handleQuickToggle}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-foreground"
          >
            Quick Toggle
          </button>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-error/10 p-3 text-error">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Change Password
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep your account secure. You are signed in as{" "}
              {profile?.email || "your account"}.
            </p>
          </div>
        </div>

        <form
          className="mt-6 grid gap-4 md:grid-cols-3"
          onSubmit={handlePasswordSubmit}
        >
          <label className="space-y-1 text-sm text-foreground">
            <span className="font-medium">Current password</span>
            <input
              type="password"
              name="current"
              value={passwords.current}
              onChange={handlePasswordChange}
              className="w-full rounded-xl border border-border bg-input px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </label>
          <label className="space-y-1 text-sm text-foreground">
            <span className="font-medium">New password</span>
            <input
              type="password"
              name="next"
              value={passwords.next}
              onChange={handlePasswordChange}
              className="w-full rounded-xl border border-border bg-input px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </label>
          <label className="space-y-1 text-sm text-foreground">
            <span className="font-medium">Confirm password</span>
            <input
              type="password"
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              className="w-full rounded-xl border border-border bg-input px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          {passwordFeedback && (
            <div
              className={`md:col-span-3 rounded-xl border px-3 py-2 text-sm ${
                passwordFeedback.type === "success"
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-error/40 bg-error/10 text-error"
              }`}
            >
              {passwordFeedback.text}
            </div>
          )}

          <div className="md:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white"
              disabled={passwordLoading}
            >
              {passwordLoading && (
                <Loader2 size={16} className="animate-spin" />
              )}{" "}
              Update Password
            </button>
          </div>
        </form>
      </section>

      {/* Notification Preferences Section */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-purple-500/10 p-3 text-purple-500">
              <Mail size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Notification Preferences
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose which notifications you want to receive
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {notificationOptions.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.key}
                  className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotificationPrefToggle(option.key)}
                    role="switch"
                    aria-checked={notificationPrefs[option.key]}
                    className={`relative h-5 w-10 rounded-full transition-colors ${
                      notificationPrefs[option.key] ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform ${
                        notificationPrefs[option.key]
                          ? "translate-x-5"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <Keyboard size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-muted-foreground">
                Navigate faster with these shortcuts
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {keyboardShortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <span className="text-sm text-foreground">{shortcut.action}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono text-muted-foreground">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-muted-foreground text-xs">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">K</kbd> anywhere to open the command palette
          </p>
        </article>
      </section>
    </div>
  );
};

export default Settings;
