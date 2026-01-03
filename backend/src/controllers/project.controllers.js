import mongoose from "mongoose";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subTask.models.js";
import { ProjectNote } from "../models/note.models.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";

const getAllProjects = asyncHandler(async (req, res) => {
    //     Check if req.user.isSuperAdmin === true
    //   YES → Get all projects from Project collection
    //   NO → Get ProjectMember records for this user → Get those projects only

    // For each project:
    //   - Calculate member count
    //   - If not super admin, show their role in that project
    //   - If super admin, no need to show role (they have all access)

    // Return project list

    const { isSuperAdmin } = req.user;

    if (isSuperAdmin) {
        // Super admin gets all projects with member counts and task stats
        const projects = await Project.aggregate([
            {
                $lookup: {
                    from: "projectmembers",
                    localField: "_id",
                    foreignField: "project",
                    as: "members",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "creator",
                },
            },
            {
                $lookup: {
                    from: "tasks",
                    localField: "_id",
                    foreignField: "project",
                    as: "tasks",
                },
            },
            {
                $unwind: {
                    path: "$creator",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    memberCount: { $size: "$members" },
                    role: "SUPER_ADMIN",
                    todoTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $eq: ["$$task.status", "todo"] },
                            },
                        },
                    },
                    inProgressTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $eq: ["$$task.status", "in_progress"] },
                            },
                        },
                    },
                    doneTasks: {
                        $size: {
                            $filter: {
                                input: "$tasks",
                                as: "task",
                                cond: { $eq: ["$$task.status", "done"] },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    createdBy: 1,
                    creator: {
                        _id: "$creator._id",
                        username: "$creator.username",
                        email: "$creator.email",
                        fullname: "$creator.fullname",
                        avatar: "$creator.avatar",
                    },
                    createdAt: 1,
                    updatedAt: 1,
                    memberCount: 1,
                    role: 1,
                    todoTasks: 1,
                    inProgressTasks: 1,
                    doneTasks: 1,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
        ]);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { projects },
                    "All projects retrieved successfully",
                ),
            );
    } else {
        // Regular user gets only projects they are a member of
        const projectMemberships = await ProjectMember.find({
            user: req.user._id,
        })
            .populate({
                path: "project",
                select: "name description createdBy createdAt updatedAt",
                populate: {
                    path: "createdBy",
                    select: "username email fullname avatar",
                },
            })
            .select("project role createdAt");

        // Transform the data to include member counts for each project
        const projectsWithDetails = await Promise.all(
            projectMemberships.map(async (membership) => {
                if (!membership.project) return null;

                const memberCount = await ProjectMember.countDocuments({
                    project: membership.project._id,
                });

                return {
                    ...membership.project.toObject(),
                    role: membership.role,
                    memberCount,
                    joinedAt: membership.createdAt,
                };
            }),
        );

        // Filter out any null entries
        const validProjects = projectsWithDetails.filter((p) => p !== null);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { projects: validProjects },
                    "User projects retrieved successfully",
                ),
            );
    }
});

const createProject = asyncHandler(async (req, res) => {
    //     Get name, description from request body
    // Validate name is provided
    // Check if project with same name exists → 409 Conflict if yes

    // Create the Project with createdBy = current user ID

    // IF user is NOT super admin:
    //   Create ProjectMember record:
    //     - user: current user ID
    //     - project: new project ID
    //     - role: "project_admin"
    // ELSE (user IS super admin):
    //   Don't create ProjectMember record
    //   Super admin doesn't need membership to access

    // Return created project

    const { name, description } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Project name is required");
    }

    // Check if project with same name exists (case insensitive)
    const existingProject = await Project.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingProject) {
        throw new ApiError(409, "A project with this name already exists");
    }

    // Create the project
    const newProject = await Project.create({
        name: name.trim(),
        description: description ? description.trim() : "",
        createdBy: req.user._id,
    });

    // If user is NOT super admin, create ProjectMember record
    if (!req.user.isSuperAdmin) {
        try {
            await ProjectMember.create({
                user: req.user._id,
                project: newProject._id,
                role: UserRolesEnum.PROJECT_ADMIN,
            });
        } catch (error) {
            // If ProjectMember creation fails, delete the project to maintain consistency
            await Project.findByIdAndDelete(newProject._id);
            throw new ApiError(
                500,
                "Failed to create project membership. Project creation rolled back.",
            );
        }
    }

    // Populate the creator information for the response
    const populatedProject = await Project.findById(newProject._id).populate(
        "createdBy",
        "username email fullname",
    );

    // Add member count for the response
    const memberCount = await ProjectMember.countDocuments({
        project: newProject._id,
    });

    const projectResponse = {
        ...populatedProject.toObject(),
        memberCount,
    };

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                projectResponse,
                "Project created successfully",
            ),
        );
});

const getProjectById = asyncHandler(async (req, res) => {
    //     Get projectId from params
    // Validate projectId format

    // IF user is super admin:
    //   Fetch project directly
    //   Return project (no role needed)
    // ELSE:
    //   Check ProjectMember for user + project combination
    //   If not found → 403 Forbidden
    //   Fetch project
    //   Return project with user's role

    const projectId = req.projectId;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    const { isSuperAdmin, _id: userId } = req.user;

    let project;

    if (isSuperAdmin) {
        // Super admin fetches project directly
        project = await Project.findById(projectId).populate(
            "createdBy",
            "username email fullname avatar",
        );

        if (!project) {
            throw new ApiError(404, "Project not found");
        }

        // Calculate stats
        const memberCount = await ProjectMember.countDocuments({
            project: project._id,
        });
        const Task = mongoose.model("Task");
        const Note = mongoose.model("Note");

        const totalTasks = await Task.countDocuments({ project: project._id });
        const inProgress = await Task.countDocuments({
            project: project._id,
            status: { $in: ["in_progress", "in progress", "IN_PROGRESS"] },
        });
        const totalNotes = await Note.countDocuments({ project: project._id });

        // Get recent tasks and notes for overview
        const recentTasks = await Task.find({ project: project._id })
            .populate("assignedTo", "username email avatar")
            .populate("assignedBy", "username email avatar")
            .sort({ createdAt: -1 })
            .limit(5)
            .select(
                "title status priority dueDate createdAt assignedTo assignedBy",
            );

        const recentNotes = await Note.find({ project: project._id })
            .populate("createdBy", "username email avatar")
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title content createdBy createdAt");

        const projectResponse = {
            ...project.toObject(),
            memberCount,
            role: "SUPER_ADMIN",
            stats: {
                totalTasks,
                inProgress,
                totalNotes,
                members: memberCount,
            },
            recentTasks,
            recentNotes,
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { project: projectResponse },
                    "Project retrieved successfully",
                ),
            );
    }

    // Regular user: check ProjectMember
    const membership = await ProjectMember.findOne({
        user: userId,
        project: projectId,
    });

    if (!membership) {
        throw new ApiError(
            403,
            "Forbidden: You do not have access to this project",
        );
    }

    project = await Project.findById(projectId).populate(
        "createdBy",
        "username email fullname avatar",
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Calculate stats
    const memberCount = await ProjectMember.countDocuments({
        project: project._id,
    });
    const Task = mongoose.model("Task");
    const Note = mongoose.model("Note");

    const totalTasks = await Task.countDocuments({ project: project._id });
    const inProgress = await Task.countDocuments({
        project: project._id,
        status: { $in: ["in_progress", "in progress", "IN_PROGRESS"] },
    });
    const totalNotes = await Note.countDocuments({ project: project._id });

    // Get recent tasks and notes for overview
    const recentTasks = await Task.find({ project: project._id })
        .populate("assignedTo", "username email avatar")
        .populate("assignedBy", "username email avatar")
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
            "title status priority dueDate createdAt assignedTo assignedBy",
        );

    const recentNotes = await Note.find({ project: project._id })
        .populate("createdBy", "username email avatar")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title content createdBy createdAt");

    const projectResponse = {
        ...project.toObject(),
        role: membership.role,
        memberCount,
        stats: {
            totalTasks,
            inProgress,
            totalNotes,
            members: memberCount,
        },
        recentTasks,
        recentNotes,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { project: projectResponse },
                "Project retrieved successfully",
            ),
        );
});

const updateProject = asyncHandler(async (req, res) => {
    //     Get projectId, name, description from request
    // Validate projectId

    // IF user is super admin:
    //   Allow update directly
    // ELSE:
    //   Check ProjectMember for this user + project
    //   If not found → 403 Forbidden
    //   If found but role !== "project_admin" → 403 Forbidden
    //   Allow update

    // If updating name, check for duplicates (exclude current project)
    // Update project
    // Return updated project

    const projectId = req.projectId;
    const { name, description } = req.body;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    const { isSuperAdmin, _id: userId } = req.user;

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(
                403,
                "Forbidden: Project admin access required to update project",
            );
        }
    }

    // Find the project
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // If updating name, check for duplicates
    if (name && name.trim() !== project.name) {
        const existingProject = await Project.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            _id: { $ne: projectId },
        });

        if (existingProject) {
            throw new ApiError(409, "A project with this name already exists");
        }
    }

    // Update project fields
    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    await project.save();

    const updatedProject = await Project.findById(projectId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { project: updatedProject },
                "Project updated successfully",
            ),
        );
});

const deleteProject = asyncHandler(async (req, res) => {
    //     Get projectId from params
    // Validate projectId

    // IF user is super admin:
    //   Allow deletion directly
    // ELSE:
    //   Check ProjectMember for this user + project
    //   If not found → 403 Forbidden
    //   If found but role !== "project_admin" → 403 Forbidden
    //   Allow deletion

    // Delete the Project
    // Cascade delete:
    //   - All ProjectMember records for this project
    //   - All Tasks for this project
    //   - All SubTasks for tasks in this project
    //   - All Notes for this project

    // Return success

    const projectId = req.projectId;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    const { isSuperAdmin, _id: userId } = req.user;

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }
        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(
                403,
                "Forbidden: Project admin access required to delete project",
            );
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    // Cascade delete related records
    await ProjectMember.deleteMany({ project: projectId });

    // Delete subtasks for all tasks in this project BEFORE deleting tasks
    const projectTasks = await Task.find({ project: projectId }).select("_id");
    const taskIds = projectTasks.map((task) => task._id);
    await SubTask.deleteMany({ task: { $in: taskIds } });

    // Now delete tasks
    await Task.deleteMany({ project: projectId });

    await ProjectNote.deleteMany({ project: projectId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Project and all related data deleted successfully",
            ),
        );
});

const getProjectMembers = asyncHandler(async (req, res) => {
    //     Get projectId from params
    // Validate projectId

    // IF user is super admin:
    //   Allow access directly
    // ELSE:
    //   Check ProjectMember for this user + project
    //   If not found → 403 Forbidden
    //   Allow access

    // Query ProjectMember for all members of this project
    // Populate user details (username, email, avatar, fullname)
    // Sort by role (project_admin first, then members) and join date

    // Return members list with their roles

    const projectId = req.projectId;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    const { isSuperAdmin, _id: userId } = req.user;

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Query ProjectMember for all members
    const members = await ProjectMember.aggregate([
        {
            $match: { project: new mongoose.Types.ObjectId(projectId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
            },
        },
        {
            $unwind: "$userDetails",
        },
        {
            $project: {
                role: 1,
                userId: "$user", // Add user ID for frontend operations
                joinedAt: "$createdAt",
                username: "$userDetails.username",
                email: "$userDetails.email",
                fullname: "$userDetails.fullname",
                avatar: "$userDetails.avatar",
            },
        },
        {
            $sort: {
                role: 1, // project_admin first
                joinedAt: 1, // then by join date
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { members },
                "Project members retrieved successfully",
            ),
        );
});

const addProjectMember = asyncHandler(async (req, res) => {
    //     Get projectId, email, role from request
    // Validate inputs

    // IF user is super admin:
    //   Allow adding directly
    // ELSE:
    //   Check ProjectMember for this user + project
    //   If not found → 403 Forbidden
    //   If found but role !== "project_admin" → 403 Forbidden
    //   Allow adding

    // Find User by email
    // If user not found → 404 Not Found (user must register first)

    // Check if user is already a member of this project
    // If yes → 409 Conflict

    // Validate role: must be "project_admin" or "member"
    // If not provided, default to "member"

    // Create ProjectMember record
    // Return new member details

    const projectId = req.projectId;
    const { email, role } = req.body;

    // Validate inputs
    if (!email || email.trim() === "") {
        throw new ApiError(400, "Email is required to add a project member");
    }

    if (role && !AvailableUserRoles.includes(role)) {
        throw new ApiError(400, "Invalid role specified");
    }

    const { isSuperAdmin, _id: userId } = req.user;

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }
        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(
                403,
                "Forbidden: Project admin access required to add members",
            );
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Find User by email
    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToAdd) {
        throw new ApiError(
            404,
            "User with this email not found. They must register first.",
        );
    }

    // Check if user's email is verified (except for super admin adding)
    if (!isSuperAdmin && !userToAdd.isEmailVerified) {
        throw new ApiError(
            400,
            "Cannot add user with unverified email. User must verify their email first.",
        );
    }

    // Check if user is already a member
    const existingMembership = await ProjectMember.findOne({
        user: userToAdd._id,
        project: projectId,
    });
    if (existingMembership) {
        throw new ApiError(409, "User is already a member of this project");
    }

    // If trying to add as project_admin, check if project already has one
    if (role === UserRolesEnum.PROJECT_ADMIN) {
        const existingAdmin = await ProjectMember.findOne({
            project: projectId,
            role: UserRolesEnum.PROJECT_ADMIN,
        });
        if (existingAdmin) {
            throw new ApiError(
                409,
                "Project already has a project admin. Only one project admin is allowed per project.",
            );
        }
    }

    // Create ProjectMember record
    const newMember = await ProjectMember.create({
        user: userToAdd._id,
        project: projectId,
        role: role || UserRolesEnum.MEMBER,
    });

    // Populate user details for response
    const populatedMember = await ProjectMember.findById(
        newMember._id,
    ).populate("user", "username email fullname avatar");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { member: populatedMember },
                "Project member added successfully",
            ),
        );
});

const updateMemberRole = asyncHandler(async (req, res) => {
    //     Get projectId, userId (target), role from request
    // Validate inputs

    // IF user is super admin:
    //   Allow update directly
    // ELSE:
    //   Check ProjectMember for current user + project
    //   If not found → 403 Forbidden
    //   If role !== "project_admin" → 403 Forbidden

    //   ADDITIONAL CHECK: Cannot modify another project admin's role
    //   If target user is also project_admin → 403 Forbidden
    //   (Only super admin can demote/promote project admins)

    // Find target user's ProjectMember record
    // If not found → 404 Not Found

    // Validate new role (project_admin or member)

    // Update role
    // Return updated member

    const projectId = req.projectId;
    const { userId: targetUserId, role } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        throw new ApiError(400, "Invalid target user ID format");
    }
    if (!AvailableUserRoles.includes(role)) {
        throw new ApiError(400, "Invalid role specified");
    }
    const { isSuperAdmin, _id: userId } = req.user;

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }
        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(
                403,
                "Forbidden: Project admin access required to update member roles",
            );
        }
    }

    // Find target user's membership
    const targetMembership = await ProjectMember.findOne({
        user: targetUserId,
        project: projectId,
    });

    if (!targetMembership) {
        throw new ApiError(404, "Target user is not a member of this project");
    }

    // Only super admin can modify project admin roles
    if (
        !isSuperAdmin &&
        targetMembership.role === UserRolesEnum.PROJECT_ADMIN
    ) {
        throw new ApiError(
            403,
            "Forbidden: Only super admin can modify project admin roles",
        );
    }

    // If promoting to project_admin, check if project already has one
    if (
        role === UserRolesEnum.PROJECT_ADMIN &&
        targetMembership.role !== UserRolesEnum.PROJECT_ADMIN
    ) {
        const existingAdmin = await ProjectMember.findOne({
            project: projectId,
            role: UserRolesEnum.PROJECT_ADMIN,
        });
        if (existingAdmin) {
            throw new ApiError(
                409,
                "Project already has a project admin. Only one project admin is allowed per project.",
            );
        }
    }

    // Update role
    targetMembership.role = role;
    await targetMembership.save();

    // Populate user details for response
    const updatedMember = await ProjectMember.findById(
        targetMembership._id,
    ).populate("user", "username email fullname avatar");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { member: updatedMember },
                "Project member role updated successfully",
            ),
        );
});

const removeMember = asyncHandler(async (req, res) => {
    //     Get projectId, userId (target) from request
    // Validate inputs

    // IF user is super admin:
    //   Allow removal directly
    // ELSE:
    //   Check ProjectMember for current user + project
    //   If not found → 403 Forbidden
    //   If role !== "project_admin" → 403 Forbidden

    //   ADDITIONAL CHECK: Cannot remove another project admin
    //   If target user is project_admin → 403 Forbidden
    //   (Only super admin can remove project admins)

    // Find target user's ProjectMember record
    // If not found → 404 Not Found

    // Delete the ProjectMember record
    // Return success

    const projectId = req.projectId;
    const { userId: targetUserId } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        throw new ApiError(400, "Invalid target user ID format");
    }
    const { isSuperAdmin, _id: currentUserId } = req.user;

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: currentUserId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }
        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(
                403,
                "Forbidden: Project admin access required to remove members",
            );
        }
    }

    // Find target user's membership
    const targetMembership = await ProjectMember.findOne({
        user: targetUserId,
        project: projectId,
    });

    if (!targetMembership) {
        throw new ApiError(404, "Target user is not a member of this project");
    }

    // Only super admin can remove project admins
    if (
        !isSuperAdmin &&
        targetMembership.role === UserRolesEnum.PROJECT_ADMIN
    ) {
        throw new ApiError(
            403,
            "Forbidden: Only super admin can remove project admins",
        );
    }

    // Delete the ProjectMember record
    await targetMembership.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project member removed successfully"));
});

const leaveProject = asyncHandler(async (req, res) => {
    //     Get projectId from request
    // Get current user ID

    // Find user's ProjectMember record
    // If not found → 404 Not Found

    // Cannot leave if you're the only project admin (unless there's a super admin)
    // Delete the ProjectMember record
    // Return success

    const projectId = req.projectId;
    const { _id: userId } = req.user;

    // Find user's membership
    const membership = await ProjectMember.findOne({
        user: userId,
        project: projectId,
    });

    if (!membership) {
        throw new ApiError(404, "You are not a member of this project");
    }

    // If user is a project admin, check if there are other admins
    if (membership.role === UserRolesEnum.PROJECT_ADMIN) {
        const adminCount = await ProjectMember.countDocuments({
            project: projectId,
            role: UserRolesEnum.PROJECT_ADMIN,
        });

        if (adminCount === 1) {
            throw new ApiError(
                400,
                "Cannot leave project: You are the only project admin. Please assign another admin first or delete the project.",
            );
        }
    }

    // Delete the ProjectMember record
    await membership.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "You have successfully left the project"),
        );
});

const toggleProjectCompletion = asyncHandler(async (req, res) => {
    const projectId = req.projectId;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    // Check permissions for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Forbidden: You do not have access to this project",
            );
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(
                403,
                "Forbidden: Only project admins can mark project as complete",
            );
        }
    }

    // Find the project
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Toggle completion status
    project.isCompleted = !project.isCompleted;
    project.completedAt = project.isCompleted ? new Date() : null;
    await project.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { project },
                `Project marked as ${project.isCompleted ? "completed" : "incomplete"}`,
            ),
        );
});

export {
    getAllProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
    addProjectMember,
    updateMemberRole,
    removeMember,
    leaveProject,
    toggleProjectCompletion,
};
