import React, { useEffect, useMemo, useState } from "react";
import { Crown, Loader2, Search, ShieldAlert, ShieldCheck, UserCog, UserMinus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSuperAdmin } from "../../context/SuperAdminContext";
import { useAuth } from "../../context/AuthContext";

const UserManagement = () => {
	const {
		adminUsers,
		fetchAdminUsers,
		fetchAdminUserById,
		selectedAdminUser,
		selectedAdminUserStats,
		editAdminUser,
		removeAdminUser,
		setSelectedAdminUser,
		setSelectedAdminUserStats,
		superAdminLoading,
		superAdminError,
	} = useSuperAdmin();

	const { user: currentUser } = useAuth();

	const [search, setSearch] = useState("");
	const [verificationFilter, setVerificationFilter] = useState("all");
	const [panelMode, setPanelMode] = useState("view");
	const [formValues, setFormValues] = useState({ username: "", email: "", isEmailVerified: true, isSuperAdmin: false });
	const [formError, setFormError] = useState(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!adminUsers.length) {
			fetchAdminUsers();
		}
	}, [adminUsers.length, fetchAdminUsers]);

	useEffect(() => {
		if (selectedAdminUser) {
			setFormValues({
				username: selectedAdminUser.username || "",
				email: selectedAdminUser.email || "",
				isEmailVerified: Boolean(selectedAdminUser.isEmailVerified),
				isSuperAdmin: Boolean(selectedAdminUser.isSuperAdmin),
			});
		}
	}, [selectedAdminUser]);

	const getUserId = (user) => user?.id || user?._id;

	const filteredUsers = useMemo(() => {
		const query = search.toLowerCase();
		return adminUsers.filter((user) => {
			const matchesSearch =
				!query ||
				user.username?.toLowerCase().includes(query) ||
				user.email?.toLowerCase().includes(query);

			const matchesVerification =
				verificationFilter === "all" ||
				(verificationFilter === "verified" && user.isEmailVerified) ||
				(verificationFilter === "unverified" && !user.isEmailVerified);

			return matchesSearch && matchesVerification;
		});
	}, [adminUsers, search, verificationFilter]);

	const openPanel = async (user, mode = "view") => {
		if (!user) return;
		setPanelMode(mode);
		await fetchAdminUserById(getUserId(user));
	};

	const closePanel = () => {
		setSelectedAdminUser(null);
		setSelectedAdminUserStats(null);
		setFormError(null);
	};

	const handleEditSubmit = async (event) => {
		event.preventDefault();
		if (!selectedAdminUser) return;
		setFormError(null);
		setIsSaving(true);

		const payload = {
			username: formValues.username.trim(),
			email: formValues.email.trim().toLowerCase(),
			isEmailVerified: formValues.isEmailVerified,
		};

		const result = await editAdminUser(getUserId(selectedAdminUser), payload);
		setIsSaving(false);
		if (result.success) {
			setPanelMode("view");
			toast.success("User details updated");
		} else {
			setFormError(result.message);
		}
	};

	const handleDeleteUser = async (user) => {
		if (!user) return;
		
		// Prevent super admin from deleting themselves
		const currentUserId = currentUser?.id || currentUser?._id;
		const targetUserId = getUserId(user);
		
		if (currentUserId === targetUserId) {
			toast.error("You cannot delete your own account");
			return;
		}
		
		const confirmed = window.confirm(
			`Delete ${user.username}? This will remove the user, their tasks, and related notes.`
		);
		if (!confirmed) return;
		const result = await removeAdminUser(targetUserId);
		if (result.success) {
			toast.success("User deleted");
		}
	};

	const renderStatus = (isEmailVerified) => (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
				isEmailVerified
					? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
					: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100"
			}`}
		>
			{isEmailVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />} {
				isEmailVerified ? "Verified" : "Pending"
			}
		</span>
	);

	const renderSuperAdminBadge = (isSuperAdmin) => {
		if (!isSuperAdmin) return null;
		return (
			<span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
				<Crown size={12} /> Super Admin
			</span>
		);
	};

	const panelVisible = Boolean(selectedAdminUser);

	const isInitialLoading = superAdminLoading && !adminUsers.length;

	return (
		<div className="space-y-6">
			<header className="space-y-1">
				<p className="text-sm uppercase tracking-wide text-muted-foreground">Super Admin</p>
				<h1 className="text-3xl font-semibold text-foreground">User Management</h1>
				<p className="text-sm text-muted-foreground">
					Review every account in the system, verify identities, or remove suspicious access.
				</p>
			</header>

			<section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-input px-3 py-2">
						<Search className="text-muted-foreground" size={18} />
						<input
							type="search"
							placeholder="Search by username or email"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="flex-1 bg-transparent text-sm focus:outline-none"
						/>
					</div>
					<select
						value={verificationFilter}
						onChange={(event) => setVerificationFilter(event.target.value)}
						className="w-full rounded-2xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none lg:w-48"
					>
						<option value="all">All statuses</option>
						<option value="verified">Email verified</option>
						<option value="unverified">Waiting verification</option>
					</select>
				</div>

				{superAdminError && (
					<p className="mt-4 rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error">
						{superAdminError}
					</p>
				)}

				{isInitialLoading ? (
					<UserTableSkeleton />
				) : (
					<div className="mt-6 overflow-x-auto">
						<table className="hidden min-w-full divide-y divide-border lg:table">
							<thead>
								<tr className="text-left text-sm text-muted-foreground">
									<th className="py-3 font-semibold">Username</th>
									<th className="py-3 font-semibold">Email</th>
									<th className="py-3 font-semibold">Joined</th>
									<th className="py-3 font-semibold">Projects</th>
									<th className="py-3 font-semibold">Status</th>
									<th className="py-3 font-semibold">Role</th>
									<th className="py-3 font-semibold">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border text-sm">
								{filteredUsers.map((user) => (
									<tr key={getUserId(user)} className="text-foreground">
										<td className="py-3 font-medium">@{user.username}</td>
										<td className="py-3 text-muted-foreground">{user.email}</td>
										<td className="py-3">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
										<td className="py-3">{user.projectCount ?? 0}</td>
										<td className="py-3">{renderStatus(user.isEmailVerified)}</td>
										<td className="py-3">{renderSuperAdminBadge(user.isSuperAdmin) || <span className="text-muted-foreground text-xs">Member</span>}</td>
										<td className="py-3">
											<div className="flex items-center gap-2">
												<button
													type="button"
													className="rounded-lg border border-border px-3 py-1 text-xs text-foreground"
													onClick={() => openPanel(user, "view")}
												>
													View
												</button>
												<button
													type="button"
													className="rounded-lg border border-border px-3 py-1 text-xs text-foreground"
													onClick={() => openPanel(user, "edit")}
												>
													Edit
												</button>
												{(currentUser?.id || currentUser?._id) !== getUserId(user) && (
													<button
														type="button"
														className="rounded-lg border border-error px-3 py-1 text-xs text-error"
														onClick={() => handleDeleteUser(user)}
													>
														Delete
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className="space-y-4 lg:hidden">
							{filteredUsers.map((user) => (
								<article key={getUserId(user)} className="rounded-2xl border border-border p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold text-foreground">@{user.username}</p>
											<p className="text-sm text-muted-foreground">{user.email}</p>
										</div>
										<div className="flex flex-col items-end gap-1">
											{renderStatus(user.isEmailVerified)}
											{renderSuperAdminBadge(user.isSuperAdmin)}
										</div>
									</div>
									<div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
										<div>
											<p className="uppercase tracking-wide">Joined</p>
											<p className="text-foreground">
												{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
											</p>
										</div>
										<div>
											<p className="uppercase tracking-wide">Projects</p>
											<p className="text-foreground">{user.projectCount ?? 0}</p>
										</div>
									</div>
									<div className="mt-4 flex flex-wrap gap-2">
										<button
											type="button"
											className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground"
											onClick={() => openPanel(user, "view")}
										>
											View
										</button>
										<button
											type="button"
											className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground"
											onClick={() => openPanel(user, "edit")}
										>
											Edit
										</button>
										{(currentUser?.id || currentUser?._id) !== getUserId(user) && (
											<button
												type="button"
												className="flex-1 rounded-lg border border-error px-3 py-2 text-xs text-error"
												onClick={() => handleDeleteUser(user)}
											>
												Delete
											</button>
										)}
									</div>
								</article>
							))}
						</div>

						{!filteredUsers.length && !superAdminLoading && (
							<div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
								No users match the current filters.
							</div>
						)}

						{superAdminLoading && (
							<div className="mt-6 flex items-center justify-center text-muted-foreground">
								<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching users...
							</div>
						)}
					</div>
				)}
			</section>

			{panelVisible && selectedAdminUser && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
					<div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Selected user</p>
								<h2 className="text-2xl font-semibold text-foreground">@{selectedAdminUser.username}</h2>
								<p className="text-sm text-muted-foreground">{selectedAdminUser.email}</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setPanelMode("view")}
									className={`rounded-xl px-4 py-2 text-sm ${
										panelMode === "view"
											? "bg-primary text-primary-foreground"
											: "border border-border text-foreground"
									}`}
								>
									Details
								</button>
								<button
									type="button"
									onClick={() => setPanelMode("edit")}
									className={`rounded-xl px-4 py-2 text-sm ${
										panelMode === "edit"
											? "bg-primary text-primary-foreground"
											: "border border-border text-foreground"
									}`}
								>
									Edit
								</button>
								<button
									type="button"
									onClick={closePanel}
									className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"
								>
									Close
								</button>
							</div>
						</div>

						{panelMode === "view" ? (
							<div className="mt-6 grid gap-4 md:grid-cols-2">
								<article className="rounded-2xl border border-border p-4">
									<h3 className="text-sm font-semibold text-foreground">Account status</h3>
									<p className="mt-2 text-sm text-muted-foreground">
										Joined {selectedAdminUser.createdAt ? new Date(selectedAdminUser.createdAt).toLocaleString() : "recently"}
									</p>
									<div className="mt-4 flex flex-wrap items-center gap-2">
										{renderStatus(selectedAdminUser.isEmailVerified)}
										{renderSuperAdminBadge(selectedAdminUser.isSuperAdmin)}
									</div>
									<p className="mt-2 text-xs text-muted-foreground">
										Last updated {selectedAdminUser.updatedAt ? new Date(selectedAdminUser.updatedAt).toLocaleString() : "—"}
									</p>
								</article>

								<article className="rounded-2xl border border-border p-4">
									<h3 className="text-sm font-semibold text-foreground">Project footprint</h3>
									<p className="mt-2 text-sm text-muted-foreground">
										{selectedAdminUserStats?.totalProjects ?? selectedAdminUser.projectCount ?? 0} total memberships
									</p>
									<ul className="mt-3 space-y-1 text-xs text-muted-foreground">
										{selectedAdminUserStats &&
											Object.entries(selectedAdminUserStats.rolesCount || {}).map(([role, count]) => (
												<li key={role} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
													<span className="capitalize">{role.replace("_", " ")}</span>
													<span className="text-foreground">{count}</span>
												</li>
											))}
									</ul>
								</article>

								<article className="md:col-span-2 rounded-2xl border border-border p-4">
									<h3 className="text-sm font-semibold text-foreground">Project memberships</h3>
									<div className="mt-3 grid gap-3 md:grid-cols-2">
										{(selectedAdminUser.projectMemberships || []).map((membership) => (
											<div key={membership._id} className="rounded-xl border border-border p-3 text-sm">
												<p className="font-semibold text-foreground">{membership.project?.name || "Untitled project"}</p>
												<p className="text-xs text-muted-foreground">Role: {membership.role}</p>
												<p className="text-xs text-muted-foreground">
													Joined {membership.createdAt ? new Date(membership.createdAt).toLocaleDateString() : "—"}
												</p>
											</div>
										))}
										{(!selectedAdminUser.projectMemberships || selectedAdminUser.projectMemberships.length === 0) && (
											<p className="text-sm text-muted-foreground">No memberships recorded.</p>
										)}
									</div>
								</article>
							</div>
						) : (
							<form className="mt-6 space-y-4" onSubmit={handleEditSubmit}>
								<label className="block space-y-1 text-sm text-foreground">
									<span className="font-medium">Username</span>
									<input
										type="text"
										value={formValues.username}
										onChange={(event) =>
											setFormValues((prev) => ({ ...prev, username: event.target.value }))
										}
										className="w-full rounded-xl border border-border bg-input px-3 py-2 focus:border-primary focus:outline-none"
									/>
								</label>
								<label className="block space-y-1 text-sm text-foreground">
									<span className="font-medium">Email</span>
									<input
										type="email"
										value={formValues.email}
										onChange={(event) =>
											setFormValues((prev) => ({ ...prev, email: event.target.value }))
										}
										className="w-full rounded-xl border border-border bg-input px-3 py-2 focus:border-primary focus:outline-none"
									/>
								</label>
								<label className="flex items-center gap-3 text-sm text-foreground">
									<input
										type="checkbox"
										checked={formValues.isEmailVerified}
										onChange={(event) =>
											setFormValues((prev) => ({ ...prev, isEmailVerified: event.target.checked }))
										}
										className="h-4 w-4 rounded border-border"
									/>
									<span>Force email verification</span>
								</label>
								{formError && (
									<p className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error">
										{formError}
									</p>
								)}
								<div className="flex items-center gap-3">
									<button
										type="submit"
										className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
										disabled={isSaving}
									>
										{isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
									</button>
									<button
										type="button"
										className="text-sm text-muted-foreground"
										onClick={() => setPanelMode("view")}
									>
										Cancel
									</button>
								</div>
							</form>
						)}

						<div className="mt-6 flex flex-wrap gap-3">
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-foreground"
								onClick={() => openPanel(selectedAdminUser, "edit")}
							>
								<UserCog size={16} /> Promote / edit
							</button>
							{/* Hide delete button for own account */}
							{(currentUser?.id || currentUser?._id) !== getUserId(selectedAdminUser) && (
								<button
									type="button"
									className="inline-flex items-center gap-2 rounded-xl border border-error px-4 py-2 text-sm text-error"
									onClick={() => handleDeleteUser(selectedAdminUser)}
								>
									<UserMinus size={16} /> Delete user
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UserManagement;

const UserTableSkeleton = () => (
	<div className="mt-6 animate-pulse">
		<div className="hidden lg:block">
			{Array.from({ length: 4 }).map((_, index) => (
				<div key={index} className="mb-4 h-14 rounded-2xl border border-border bg-muted" />
			))}
		</div>
		<div className="space-y-4 lg:hidden">
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="h-32 rounded-2xl border border-border bg-muted" />
			))}
		</div>
	</div>
);
