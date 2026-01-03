import React, { useEffect, useMemo, useState } from "react";
import {
	BarChart3,
	Info,
	LayoutGrid,
	Loader2,
	Search,
	Trash2,
	TrendingUp,
	Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSuperAdmin } from "../../context/SuperAdminContext";

const ProjectManagement = () => {
	const {
		adminProjects,
		adminProjectSummary,
		fetchAdminProjects,
		fetchProjectStats,
		selectedAdminProject,
		selectedAdminProjectStats,
		setSelectedAdminProject,
		setSelectedAdminProjectStats,
		removeAdminProject,
		superAdminLoading,
		superAdminError,
	} = useSuperAdmin();

	const [search, setSearch] = useState("");

	useEffect(() => {
		if (!adminProjects.length) {
			fetchAdminProjects();
		}
	}, [adminProjects.length, fetchAdminProjects]);

	const getProjectId = (project) => project?.id || project?._id;

	const filteredProjects = useMemo(() => {
		if (!search.trim()) return adminProjects;
		const query = search.toLowerCase();
		return adminProjects.filter((project) => {
			const matchesName = project.name?.toLowerCase().includes(query);
			const matchesCreator = project.creator?.username?.toLowerCase().includes(query);
			const matchesEmail = project.creator?.email?.toLowerCase().includes(query);
			return matchesName || matchesCreator || matchesEmail;
		});
	}, [adminProjects, search]);

	const openPanel = async (project) => {
		if (!project) return;
		setSelectedAdminProject(project);
		await fetchProjectStats(getProjectId(project));
	};

	const closePanel = () => {
		setSelectedAdminProject(null);
		setSelectedAdminProjectStats(null);
	};

	const handleDeleteProject = async (project) => {
		if (!project) return;
		const confirmed = window.confirm(
			`Delete project "${project.name}"? All tasks, notes, and memberships will be removed.`
		);
		if (!confirmed) return;
		const result = await removeAdminProject(getProjectId(project));
		if (result.success) {
			toast.success("Project deleted");
			closePanel();
		}
	};

	const summaryCards = [
		{
			label: "Total projects",
			value: adminProjectSummary?.totalProjects ?? adminProjects.length,
			icon: LayoutGrid,
			helper: "Across the platform",
		},
		{
			label: "Total members",
			value: adminProjectSummary?.totalMembers ?? 0,
			icon: Users,
			helper: "People collaborating",
		},
		{
			label: "Total tasks",
			value: adminProjectSummary?.totalTasks ?? 0,
			icon: BarChart3,
			helper: "Tracked workload",
		},
		{
			label: "Avg. completion",
			value: `${Math.round((adminProjectSummary?.averageCompletionRate || 0) * 100)}%`,
			icon: TrendingUp,
			helper: "Subtask completion",
		},
	];

	const renderTaskBreakdown = (project) => {
		const todo = project.todoTasks ?? 0;
		const inProgress = project.inProgressTasks ?? 0;
		const done = project.doneTasks ?? 0;
		const total = todo + inProgress + done || 1;

		return (
			<div className="space-y-1 text-xs text-muted-foreground">
				<div className="flex items-center justify-between">
					<span>Todo</span>
					<span className="text-foreground">{todo}</span>
				</div>
				<div className="flex items-center justify-between">
					<span>In progress</span>
					<span className="text-foreground">{inProgress}</span>
				</div>
				<div className="flex items-center justify-between">
					<span>Done</span>
					<span className="text-foreground">{done}</span>
				</div>
				<div className="mt-1 h-1.5 rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary"
						style={{ width: `${(done / total) * 100}%` }}
					/>
				</div>
			</div>
		);
	};

	const dedupedActiveUsers = useMemo(() => {
		const raw = selectedAdminProjectStats?.mostActiveUsers || [];
		const seen = new Set();
		const unique = [];
		for (const user of raw) {
			const id = user?._id || user?.id || user?.email;
			if (!id || seen.has(id)) continue;
			seen.add(id);
			unique.push(user);
			if (unique.length >= 4) break;
		}
		return unique;
	}, [selectedAdminProjectStats]);

	const isInitialLoading = superAdminLoading && !adminProjects.length;

	return (
		<div className="space-y-6">
			<header>
				<p className="text-xs uppercase tracking-wide text-muted-foreground">Super Admin</p>
				<h1 className="mt-1 text-3xl font-semibold text-foreground">Project Management</h1>
				<p className="text-sm text-muted-foreground">
					Audit every project, inspect health, and remove hostile workspaces in a single view.
				</p>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{summaryCards.map((card) => (
					<article key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
								<p className="mt-2 text-3xl font-semibold text-foreground">{card.value}</p>
							</div>
							<card.icon className="h-10 w-10 rounded-2xl bg-muted p-2 text-primary" />
						</div>
						<p className="mt-3 text-xs text-muted-foreground">{card.helper}</p>
					</article>
				))}
			</section>

			<section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-input px-3 py-2">
						<Search size={18} className="text-muted-foreground" />
						<input
							type="search"
							placeholder="Search projects or owners"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="flex-1 bg-transparent text-sm focus:outline-none"
						/>
					</div>
					<p className="text-sm text-muted-foreground">{filteredProjects.length} projects visible</p>
				</div>

				{superAdminError && (
					<p className="mt-4 rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error">
						{superAdminError}
					</p>
				)}

				{isInitialLoading ? (
					<ProjectTableSkeleton />
				) : (
					<div className="mt-6 overflow-x-auto">
						<table className="hidden min-w-full divide-y divide-border lg:table">
							<thead>
								<tr className="text-left text-sm text-muted-foreground">
									<th className="py-3 font-semibold">Project</th>
									<th className="py-3 font-semibold">Owner</th>
									<th className="py-3 font-semibold">Members</th>
									<th className="py-3 font-semibold">Tasks</th>
									<th className="py-3 font-semibold">Created</th>
									<th className="py-3 font-semibold">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border text-sm">
								{filteredProjects.map((project) => (
									<tr key={getProjectId(project)} className="text-foreground">
										<td className="py-3">
											<p className="font-semibold">{project.name}</p>
											<p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
										</td>
										<td className="py-3">
											<p className="font-medium">{project.creator?.username || "Unknown"}</p>
											<p className="text-xs text-muted-foreground">{project.creator?.email || "—"}</p>
										</td>
										<td className="py-3">{project.memberCount ?? 0}</td>
										<td className="py-3">
											<p>{project.taskCount ?? 0} tasks</p>
											<p className="text-xs text-muted-foreground">{project.noteCount ?? 0} notes</p>
										</td>
										<td className="py-3">
											{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
										</td>
										<td className="py-3">
											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													className="rounded-lg border border-border px-3 py-1 text-xs"
													onClick={() => openPanel(project)}
												>
													Inspect
												</button>
												<button
													type="button"
													className="rounded-lg border border-error px-3 py-1 text-xs text-error"
													onClick={() => handleDeleteProject(project)}
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className="space-y-4 lg:hidden">
							{filteredProjects.map((project) => (
								<article key={getProjectId(project)} className="rounded-2xl border border-border p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold">{project.name}</p>
											<p className="text-xs text-muted-foreground">{project.creator?.username || "Unknown"}</p>
										</div>
										<button
											type="button"
											className="rounded-lg border border-border px-3 py-1 text-xs"
											onClick={() => openPanel(project)}
										>
											Inspect
										</button>
									</div>
									<p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
									<div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
										<div>
											<p className="uppercase tracking-wide">Members</p>
											<p className="text-foreground">{project.memberCount ?? 0}</p>
										</div>
										<div>
											<p className="uppercase tracking-wide">Tasks</p>
											<p className="text-foreground">{project.taskCount ?? 0}</p>
										</div>
										<div>
											<p className="uppercase tracking-wide">Notes</p>
											<p className="text-foreground">{project.noteCount ?? 0}</p>
										</div>
										<div>
											<p className="uppercase tracking-wide">Created</p>
											<p className="text-foreground">
												{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
											</p>
										</div>
									</div>
									<div className="mt-4 flex gap-2">
										<button
											type="button"
											className="flex-1 rounded-lg border border-border px-3 py-2 text-xs"
											onClick={() => openPanel(project)}
										>
											View stats
										</button>
										<button
											type="button"
											className="flex-1 rounded-lg border border-error px-3 py-2 text-xs text-error"
											onClick={() => handleDeleteProject(project)}
										>
											Delete
										</button>
									</div>
								</article>
							))}
						</div>

						{!filteredProjects.length && !superAdminLoading && (
							<div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
								No projects match the current filters.
							</div>
						)}

						{superAdminLoading && (
							<div className="mt-6 flex items-center justify-center text-muted-foreground">
								<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Syncing project inventory...
							</div>
						)}
					</div>
				)}
			</section>

			{selectedAdminProject && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
					<div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Project overview</p>
								<h2 className="text-2xl font-semibold text-foreground">{selectedAdminProject.name}</h2>
								<p className="text-sm text-muted-foreground">{selectedAdminProject.description || "No description"}</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
									onClick={closePanel}
								>
									Close
								</button>
								<button
									type="button"
									className="inline-flex items-center gap-2 rounded-xl border border-error px-4 py-2 text-sm text-error"
									onClick={() => handleDeleteProject(selectedAdminProject)}
								>
									<Trash2 size={16} /> Delete project
								</button>
							</div>
						</div>

						<div className="mt-6 grid gap-4 md:grid-cols-2">
							<article className="rounded-2xl border border-border p-4">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
								<p className="mt-1 text-sm text-foreground">
									{selectedAdminProject.createdAt
										? new Date(selectedAdminProject.createdAt).toLocaleString()
										: "Unknown"}
								</p>
								<p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
								<p className="text-sm text-foreground">
									{selectedAdminProject.creator?.username || "Unknown"}
								</p>
								<p className="text-xs text-muted-foreground">{selectedAdminProject.creator?.email || "—"}</p>
							</article>

							<article className="rounded-2xl border border-border p-4">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Membership</p>
								<p className="mt-1 text-3xl font-semibold text-foreground">
									{selectedAdminProject.memberCount ?? selectedAdminProjectStats?.totalMembers ?? 0}
								</p>
								<p className="text-xs text-muted-foreground">Total collaborators</p>
								<div className="mt-4 text-sm text-muted-foreground">
									{renderTaskBreakdown(selectedAdminProject)}
								</div>
							</article>

							<article className="rounded-2xl border border-border p-4 md:col-span-2">
								<h3 className="text-sm font-semibold text-foreground">Performance snapshot</h3>
								<div className="mt-4 grid gap-4 md:grid-cols-3">
									<div className="rounded-2xl border border-border p-4">
										<p className="text-xs uppercase tracking-wide text-muted-foreground">Total tasks</p>
										<p className="mt-2 text-2xl font-semibold text-foreground">
											{selectedAdminProjectStats?.totalTasks ?? selectedAdminProject.taskCount ?? 0}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedAdminProjectStats?.totalNotes ?? selectedAdminProject.noteCount ?? 0} notes
										</p>
									</div>
									<div className="rounded-2xl border border-border p-4">
										<p className="text-xs uppercase tracking-wide text-muted-foreground">Subtasks</p>
										<p className="mt-2 text-2xl font-semibold text-foreground">
											{selectedAdminProjectStats?.totalSubTasks ?? selectedAdminProject.subTaskCount ?? 0}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedAdminProjectStats?.completedSubTasks ?? selectedAdminProject.completedSubTasks ?? 0} completed
										</p>
									</div>
									<div className="rounded-2xl border border-border p-4">
										<p className="text-xs uppercase tracking-wide text-muted-foreground">Completion rate</p>
										<p className="mt-2 text-2xl font-semibold text-foreground">
											{Math.round(
												(selectedAdminProjectStats?.completionRate ?? selectedAdminProject.completionRate ?? 0) * 100
											)}
											%
										</p>
										<p className="text-xs text-muted-foreground">Based on subtasks</p>
									</div>
								</div>

								<div className="mt-6">
									<p className="text-xs uppercase tracking-wide text-muted-foreground">Task distribution</p>
									<div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
										{(() => {
											const distribution = selectedAdminProjectStats?.taskDistribution;
											if (!distribution) {
												return (
													<div
														className="h-full rounded-full bg-muted-foreground/30"
														style={{ width: "100%" }}
													/>
												);
											}
											return (
												<div className="flex h-full w-full">
													<span
														className="h-full bg-amber-400"
														style={{ width: `${distribution.todoPercentage ?? 0}%` }}
													/>
													<span
														className="h-full bg-sky-400"
														style={{ width: `${distribution.inProgressPercentage ?? 0}%` }}
													/>
													<span
														className="h-full bg-emerald-500"
														style={{ width: `${distribution.donePercentage ?? 0}%` }}
													/>
												</div>
											);
										})()}
									</div>
									<div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
										<div className="flex items-center gap-2">
											<span className="inline-block h-3 w-3 rounded-full bg-amber-400" /> Todo
											{Math.round(
												selectedAdminProjectStats?.taskDistribution?.todoPercentage || 0
											)}%
										</div>
										<div className="flex items-center gap-2">
											<span className="inline-block h-3 w-3 rounded-full bg-sky-400" /> In progress
											{Math.round(
												selectedAdminProjectStats?.taskDistribution?.inProgressPercentage || 0
											)}%
										</div>
										<div className="flex items-center gap-2">
											<span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Done
											{Math.round(
												selectedAdminProjectStats?.taskDistribution?.donePercentage || 0
											)}%
										</div>
									</div>
								</div>

								<div className="mt-6">
									<p className="text-xs uppercase tracking-wide text-muted-foreground">Most active contributors</p>
									<div className="mt-3 grid gap-3 sm:grid-cols-2">
										{dedupedActiveUsers.length ? (
											dedupedActiveUsers.map((user) => (
												<div key={user._id || user.email} className="rounded-xl border border-border p-3 text-sm">
													<p className="font-semibold text-foreground">{user.username || user.fullname || user.email}</p>
													{user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
												</div>
											))
										) : (
											<div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
												<Info size={14} /> Not enough data to determine contributors yet.
											</div>
										)}
									</div>
								</div>
							</article>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProjectManagement;

const ProjectTableSkeleton = () => (
	<div className="mt-6 animate-pulse">
		<div className="hidden lg:block">
			{Array.from({ length: 4 }).map((_, index) => (
				<div key={index} className="mb-4 h-16 rounded-2xl border border-border bg-muted" />
			))}
		</div>
		<div className="space-y-4 lg:hidden">
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="h-36 rounded-2xl border border-border bg-muted" />
			))}
		</div>
	</div>
);
