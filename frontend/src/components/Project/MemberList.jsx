import React, { useState, useEffect } from "react";
import { Users, Plus, Mail, Shield, Trash2, X, LogOut } from "lucide-react";
import { searchUsers } from "../../api/user";
import { useAuth } from "../../context/AuthContext";

const roleOptions = [
  { value: "project_admin", label: "Project Admin" },
  { value: "member", label: "Member" },
];

const MemberList = ({
  members = [],
  canManage = false,
  canManageAdmins = false,
  onAddMember,
  onRoleChange,
  onRemoveMember,
  onLeaveProject,
  isProcessing = false,
  projectId,
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    role: "member",
    userId: "",
  });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check if project already has a project admin
  const hasProjectAdmin = members.some(
    (m) => (m.role || m.projectRole || "").toLowerCase() === "project_admin"
  );

  // Search for users when search query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const users = await searchUsers(searchQuery, projectId);
          setUserSuggestions(users || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Error searching users:", err);
          setUserSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setUserSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, projectId]);

  const toggleForm = () => {
    setShowAddForm((prev) => !prev);
    setError(null);
    setSearchQuery("");
    setUserSuggestions([]);
    setShowSuggestions(false);
    setNewMember({ email: "", role: "member", userId: "" });
  };

  const handleSelectUser = (user) => {
    setNewMember({
      email: user.email,
      role: newMember.role,
      userId: user._id || user.id,
    });
    setSearchQuery(user.email);
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setError(null);

    if (!newMember.email.trim()) {
      setError("Email is required.");
      return;
    }

    // Check if trying to add as project admin when one already exists
    if (newMember.role === "project_admin" && hasProjectAdmin) {
      setError(
        "This project already has a project admin. Only one project admin is allowed per project."
      );
      return;
    }

    const result = await onAddMember?.({
      email: newMember.email.trim(),
      role: newMember.role,
    });

    // Show error from backend if operation failed
    if (result && !result.success) {
      setError(result.message || "Failed to add member");
      return;
    }

    // Success - reset form
    setNewMember({ email: "", role: "member", userId: "" });
    setSearchQuery("");
    setShowAddForm(false);
    setError(null);
  };

  const renderRoleSelect = (member) => {
    // Get user ID - check userId field from backend or fallback to _id
    const userId =
      member.userId ||
      member.user?._id ||
      member.user?.id ||
      member._id ||
      member.id;
    const memberRole = (
      member.role ||
      member.projectRole ||
      "member"
    ).toLowerCase();

    // Super admin can change anyone's role
    // Project admin can change regular members' roles but not other project admins
    const isProjectAdmin = memberRole === "project_admin";
    const locked =
      !canManage ||
      memberRole === "super_admin" ||
      (isProjectAdmin && !canManageAdmins);

    const handleRoleChange = async (event) => {
      const newRole = event.target.value;

      // Check if promoting to project_admin when one already exists
      if (
        newRole === "project_admin" &&
        memberRole !== "project_admin" &&
        hasProjectAdmin
      ) {
        setError(
          "This project already has a project admin. Only one project admin is allowed per project."
        );
        return;
      }

      const result = await onRoleChange?.({
        userId: userId,
        role: newRole,
      });

      // Show error from backend if operation failed
      if (result && !result.success) {
        setError(result.message || "Failed to update member role");
      } else {
        setError(null);
      }
    };

    return (
      <select
        className="rounded-md border border-border bg-input px-2 py-1 text-sm"
        value={memberRole}
        onChange={handleRoleChange}
        disabled={locked}
      >
        {roleOptions.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <section className="space-y-4 animate-fade-in">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">Project Members</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage collaborators and adjust project roles.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={toggleForm}
            className="inline-flex items-center gap-2 rounded-xl gradient-secondary text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all btn-hover"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        )}
      </header>

      {showAddForm && canManage && (
        <form
          onSubmit={handleAddMember}
          className="rounded-xl border border-card-border bg-card p-5 space-y-4 shadow-sm animate-slide-down"
        >
          {error && (
            <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3 font-medium">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-2 relative">
              <span className="text-sm font-semibold text-foreground">
                Member Email
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-card-border bg-input px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Mail size={16} className="text-muted-foreground" />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setNewMember((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
                  }}
                  onFocus={() => {
                    if (userSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
              </div>
              {showSuggestions && userSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {userSuggestions.map((user) => (
                    <button
                      key={user._id || user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-left"
                    >
                      {user.avatar && (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      {!user.avatar && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {(user.username || user.email)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.username}
                          </p>
                          {user.isEmailVerified ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && (
                <p className="text-xs text-muted-foreground mt-1">
                  Searching...
                </p>
              )}
              {searchQuery.length >= 2 &&
                !isSearching &&
                userSuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No users found
                  </p>
                )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">
                Role
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-card-border bg-input px-3 py-2.5">
                <Shield size={16} className="text-muted-foreground" />
                <select
                  className="flex-1 bg-transparent text-sm outline-none"
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  {roleOptions.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                      disabled={
                        role.value === "project_admin" && hasProjectAdmin
                      }
                    >
                      {role.label}
                      {role.value === "project_admin" && hasProjectAdmin
                        ? " (Already assigned)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              {hasProjectAdmin && newMember.role === "project_admin" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Only one project admin is allowed per project
                </p>
              )}
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-xl gradient-primary text-white px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all btn-hover disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-card-border rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-card-border text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Member</th>
              <th className="px-5 py-4 font-semibold">Email</th>
              <th className="px-5 py-4 font-semibold">Role</th>
              {canManage && (
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border bg-card">
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 4 : 3}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No members yet. Invite teammates to collaborate.
                </td>
              </tr>
            )}

            {members.map((member, idx) => {
              const memberRole = (
                member.role ||
                member.projectRole ||
                "member"
              ).toLowerCase();
              return (
                <tr
                  key={member.id || member._id}
                  className="text-foreground hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold flex items-center justify-center text-base border-2 border-primary/10">
                        {(member.name ||
                          member.fullName ||
                          member.email)?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {member.name || member.fullName || "Unnamed"}
                        </p>
                        {member.username && (
                          <p className="text-xs text-muted-foreground">
                            @{member.username || member.handle || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground font-medium">
                    {member.email}
                  </td>
                  <td className="px-5 py-4">
                    {canManage ? (
                      renderRoleSelect(member)
                    ) : (
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          memberRole === "project_admin"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : memberRole === "admin"
                            ? "bg-error/10 text-error border border-error/20"
                            : "bg-muted text-muted-foreground border border-card-border"
                        }`}
                      >
                        {member.role || member.projectRole}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveMember?.(member)}
                        disabled={
                          (
                            member.role ||
                            member.projectRole ||
                            ""
                          ).toLowerCase() === "admin" ||
                          ((
                            member.role ||
                            member.projectRole ||
                            ""
                          ).toLowerCase() === "project_admin" &&
                            !canManageAdmins)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground font-medium bg-muted/30 px-4 py-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <span>
            {members.length} team member{members.length === 1 ? "" : "s"}
          </span>
        </div>
        {onLeaveProject && (
          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm(
                "Are you sure you want to leave this project? You will lose access to all project tasks and notes."
              );
              if (confirmed) {
                onLeaveProject();
              }
            }}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogOut size={14} />
            Leave Project
          </button>
        )}
      </div>
    </section>
  );
};

export default MemberList;
