import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	Activity,
	ArrowUpRight,
	Briefcase,
	CalendarDays,
	CheckCircle2,
	Loader2,
	Mail,
	Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { getAllTasks } from "../../api/tasks";

const Profile = () => {
	const { user: authUser, refreshToken } = useAuth();
	const {
		profile,
		userProjects,
		userLoading,
		userError,
		fetchProfile,
		fetchUserProjects,
		updateProfile,
	} = useUser();

	const [formValues, setFormValues] = useState({
		username: "",
		fullname: "",
		avatarUrl: "",
		bio: "",
	});
	const [feedback, setFeedback] = useState(null);
	const [saving, setSaving] = useState(false);
	const [assignedTasks, setAssignedTasks] = useState([]);
	const [tasksLoading, setTasksLoading] = useState(false);
	const [tasksError, setTasksError] = useState(null);

	const loadInitialData = useCallback(() => {
		fetchProfile();
		fetchUserProjects();
	}, [fetchProfile, fetchUserProjects]);

	useEffect(() => {
		loadInitialData();
	}, [loadInitialData]);

	useEffect(() => {
		if (profile) {
			setFormValues((prev) => ({
				...prev,
				username: profile.username || "",
				fullname: profile.fullname || "",
				avatarUrl: profile.avatar?.url || "",
			}));

			const storedBio = localStorage.getItem(`pf-bio-${profile._id}`);
			if (storedBio) {
				setFormValues((prev) => ({ ...prev, bio: storedBio }));
			}
		}
	}, [profile]);

	const loadAssignedTasks = useCallback(async () => {
		if (!userProjects.length || !(profile?._id || authUser?._id)) {
			setAssignedTasks([]);
			return;
		}

		setTasksLoading(true);
		setTasksError(null);

			try {
				const userId = profile?._id || authUser?._id;
				const responses = await Promise.allSettled(
					userProjects.map((project) => getAllTasks(project._id))
				);

				const mine = [];
				responses.forEach((result, index) => {
					if (result.status === "fulfilled") {
						const { value } = result;
						const projectTasks = Array.isArray(value?.tasks)
							? value.tasks
							: Array.isArray(value)
							? value
							: [];
						const projectName = userProjects[index]?.name || "Project";
						projectTasks.forEach((task) => {
							const assignedId = task.assignedTo?._id || task.assignedTo;
							if (assignedId === userId) {
								mine.push({
									...task,
									projectName,
								});
							}
						});
					} else {
						setTasksError("Some project tasks could not be fetched");
					}
				});

				setAssignedTasks(mine);
			} catch (error) {
				setTasksError(error.response?.data?.message || "Failed to load tasks");
			} finally {
				setTasksLoading(false);
			}
		}, [authUser?._id, profile?._id, userProjects]);

	useEffect(() => {
		loadAssignedTasks();
	}, [loadAssignedTasks]);

	const handleAvatarUpload = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		
		// Validate file type
		if (!file.type.startsWith('image/')) {
			setFeedback({ type: "error", text: "Please upload an image file" });
			return;
		}
		
		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setFeedback({ type: "error", text: "Image size must be less than 5MB" });
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				// Create canvas to resize image
				const canvas = document.createElement('canvas');
				const MAX_WIDTH = 400;
				const MAX_HEIGHT = 400;
				let width = img.width;
				let height = img.height;
				
				// Calculate new dimensions
				if (width > height) {
					if (width > MAX_WIDTH) {
						height *= MAX_WIDTH / width;
						width = MAX_WIDTH;
					}
				} else {
					if (height > MAX_HEIGHT) {
						width *= MAX_HEIGHT / height;
						height = MAX_HEIGHT;
					}
				}
				
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, width, height);
				
				// Convert to base64 with compression
				const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
				setFormValues((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	};

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormValues((prev) => ({ ...prev, [name]: value }));
	};

	const handleProfileSubmit = async (event) => {
		event.preventDefault();
		setFeedback(null);

		const payload = {};
		if (formValues.username && formValues.username !== (profile?.username || "")) {
			payload.username = formValues.username.trim();
		}
		if (formValues.fullname !== (profile?.fullname || "")) {
			payload.fullname = formValues.fullname.trim();
		}
		if (formValues.avatarUrl !== (profile?.avatar?.url || "")) {
			payload.avatar = { url: formValues.avatarUrl };
		}

		const nothingToUpdate = Object.keys(payload).length === 0;
		localStorage.setItem(`pf-bio-${profile?._id || "anon"}`, formValues.bio || "");

		if (nothingToUpdate) {
			setFeedback({ type: "info", text: "Bio saved locally. No profile changes detected." });
			return;
		}

		setSaving(true);
		const result = await updateProfile(payload);
		setSaving(false);

		if (result.success) {
			setFeedback({ type: "success", text: result.message || "Profile updated" });
			await fetchProfile();
			await refreshToken();
		} else {
			setFeedback({ type: "error", text: result.message || "Failed to update profile" });
		}
	};

	const activityStats = useMemo(() => {
		const adminCount = userProjects.filter((project) => project.role === "project_admin").length;
		return [
			{
				label: "Projects Joined",
				value: userProjects.length,
				helper: "Active memberships",
				icon: Briefcase,
			},
			{
				label: "Admin Roles",
				value: adminCount,
				helper: "Projects you lead",
				icon: CheckCircle2,
			},
			{
				label: "Tasks Assigned",
				value: assignedTasks.length,
				helper: "Across all projects",
				icon: Activity,
			},
			{
				label: "Member Since",
				value: profile?.createdAt
					? new Date(profile.createdAt).toLocaleDateString()
					: "—",
				helper: "Join date",
				icon: CalendarDays,
			},
		];
	}, [assignedTasks.length, profile?.createdAt, userProjects]);

	const recentTasks = assignedTasks.slice(0, 5);
	const avatarPreview = formValues.avatarUrl || profile?.avatar?.url || "https://placehold.co/96x96";

	if (userLoading && !profile) {
		return (
			<div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
				<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profile...
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header className="space-y-1">
				<p className="text-sm uppercase tracking-wide text-muted-foreground">Account</p>
				<h1 className="text-3xl font-semibold text-foreground">Profile & Activity</h1>
				<p className="text-muted-foreground">
					Update your personal details, review projects you contribute to, and track assignments across teams.
				</p>
			</header>

			{userError && (
				<div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">{userError}</div>
			)}

			<section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<div className="flex flex-wrap items-center gap-4">
							<div className="relative">
								<img
									src={avatarPreview}
									alt="Avatar preview"
									className="h-20 w-20 rounded-2xl border border-border object-cover"
								/>
								<label className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
									<Upload size={16} />
									<input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
								</label>
							</div>
							<div>
								<h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
								<p className="text-sm text-muted-foreground">Displayed anywhere teammates see your profile.</p>
							</div>
						</div>

						<form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
							<div className="grid gap-4 md:grid-cols-2">
								<label className="space-y-1 text-sm text-foreground">
									<span className="font-medium">Username</span>
									<input
										type="text"
										name="username"
										value={formValues.username}
										onChange={handleChange}
										className="w-full rounded-xl border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none"
										placeholder="your-username"
									/>
								</label>
								<label className="space-y-1 text-sm text-foreground">
									<span className="font-medium">Email</span>
									<div className="flex items-center rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
										<Mail size={16} className="mr-2 text-muted-foreground" />
										<span className="flex-1 truncate">{profile?.email || authUser?.email || ""}</span>
										<button
											type="button"
											onClick={() => navigator.clipboard.writeText(profile?.email || authUser?.email || "")}
											className="text-xs text-primary hover:underline"
										>
											Copy
										</button>
									</div>
								</label>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<label className="space-y-1 text-sm text-foreground">
									<span className="font-medium">Full Name</span>
									<input
										type="text"
										name="fullname"
										value={formValues.fullname}
										onChange={handleChange}
										className="w-full rounded-xl border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none"
										placeholder="Jane Doe"
									/>
								</label>
								<label className="space-y-1 text-sm text-foreground">
									<span className="font-medium">Bio (local only)</span>
									<input
										type="text"
										name="bio"
										value={formValues.bio}
										onChange={handleChange}
										className="w-full rounded-xl border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none"
										placeholder="Product lead, coffee enthusiast"
									/>
								</label>
							</div>

							{feedback && (
								<div
									className={`rounded-xl border px-3 py-2 text-sm ${
										feedback.type === "success"
											? "border-success/40 bg-success/10 text-success"
											: feedback.type === "error"
											? "border-error/40 bg-error/10 text-error"
											: "border-border bg-muted text-muted-foreground"
									}`}
								>
									{feedback.text}
								</div>
							)}

							<div className="flex flex-wrap items-center gap-3">
								<button
									type="submit"
									className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
									disabled={saving}
								>
									{saving && <Loader2 size={16} className="animate-spin" />} Save Changes
								</button>
								<span className="text-xs text-muted-foreground">
									Bio is stored only in this browser until backend support is enabled.
								</span>
							</div>
						</form>
					</article>

					<article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-foreground">My Projects</h2>
								<p className="text-sm text-muted-foreground">Quick links to spaces where you collaborate.</p>
							</div>
							<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
								{userProjects.length} active
							</span>
						</div>

						{userLoading && userProjects.length === 0 ? (
							<div className="flex h-32 items-center justify-center text-muted-foreground">
								<Loader2 className="h-5 w-5 animate-spin" />
							</div>
						) : userProjects.length === 0 ? (
							<div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
								You are not part of any projects yet.
							</div>
						) : (
							<div className="mt-6 grid gap-4 md:grid-cols-2">
								{userProjects.map((project) => (
									<article
										key={project._id}
										className="rounded-2xl border border-border p-4 transition hover:border-primary"
									>
										<p className="text-xs uppercase tracking-wide text-muted-foreground">{project.role}</p>
										<h3 className="mt-1 text-lg font-semibold text-foreground">{project.name}</h3>
										<p className="text-sm text-muted-foreground line-clamp-2">
											{project.description || "No description provided"}
										</p>
										<div className="mt-4 flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												Joined {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "recently"}
											</span>
											<Link
												to={`/projects/${project._id}`}
												className="inline-flex items-center gap-1 text-primary hover:underline"
											>
												View <ArrowUpRight size={14} />
											</Link>
										</div>
									</article>
								))}
							</div>
						)}
					</article>
				</div>

				<div className="space-y-6">
					<article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<h2 className="text-xl font-semibold text-foreground">Activity Summary</h2>
						<p className="text-sm text-muted-foreground">Snapshot of your contributions.</p>
						<div className="mt-4 space-y-4">
							{activityStats.map((stat) => (
								<div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-border p-3">
									<span className="rounded-2xl bg-background-secondary p-3 text-primary">
										<stat.icon size={20} />
									</span>
									<div>
										<p className="text-sm text-muted-foreground">{stat.label}</p>
										<p className="text-xl font-semibold text-foreground">{stat.value}</p>
										<p className="text-xs text-muted-foreground">{stat.helper}</p>
									</div>
								</div>
							))}
						</div>
					</article>

					<article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-foreground">Assigned Tasks</h2>
								<p className="text-sm text-muted-foreground">Tasks where you are the assignee.</p>
							</div>
							{tasksLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
						</div>

						{tasksError && (
							<p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
								{tasksError}
							</p>
						)}

						{recentTasks.length === 0 && !tasksLoading ? (
							<div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
								No tasks assigned to you yet.
							</div>
						) : (
							<div className="mt-4 space-y-4">
								{recentTasks.map((task) => (
									<article key={task._id} className="rounded-2xl border border-border p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs uppercase tracking-wide text-muted-foreground">{task.projectName}</p>
												<h3 className="text-base font-semibold text-foreground">{task.title}</h3>
											</div>
											<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
												{task.status}
											</span>
										</div>
										{task.description && (
											<p className="mt-2 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
										)}
										<p className="mt-3 text-xs text-muted-foreground">
											Last updated {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : "just now"}
										</p>
									</article>
								))}
							</div>
						)}
					</article>
				</div>
			</section>
		</div>
	);
};

export default Profile;
