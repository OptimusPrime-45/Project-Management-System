import mongoose, { Types } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { TaskStatusEnum } from "../utils/constants.js";

const getAllUsers = asyncHandler(async (req, res) => {
//     Get all users from User collection
// Exclude sensitive fields (password, tokens)
// Sort by registration date

// For each user:
//   - Count how many projects they're in
//   - Show their roles across projects
  
// Return users list

    const users = await User.aggregate([
        // 1. Remove sensitive fields
        {
            $project: {
                password: 0,
                refreshToken: 0,
                emailVerificationToken: 0,
                emailVerificationTokenExpiry: 0,
            },
        },
        // 2. Lookup ProjectMember to count projects
        {
            $lookup: {
                from: "projectmembers",
                localField: "_id",
                foreignField: "user",
                as: "projectMemberships",
            },
        },
        // 3. Add projectCount field
        {
            $addFields: {
                projectCount: { $size: "$projectMemberships" },
            },
        },
        // 4. Remove projectMemberships array
        {
            $project: {
                projectMemberships: 0,
            },
        },
        // 5. Sort by creation date
        {
            $sort: { createdAt: -1 },
        },
    ]);

    if (!users || users.length === 0) {
        throw new ApiError(404, "No users found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                users,
                "Users retrieved successfully",
            )
        )
})

const getUserById = asyncHandler(async (req, res) => {
//     Get userId from params
// Find user by ID
// Exclude password and tokens

// Get all ProjectMember records for this user
// Populate project details
// Show what projects they're in and their roles

// Return user details with project memberships

    const { userId } = req.params;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID format")
    }

    // Find user and exclude sensitive fields
    const user = await User.findById(userId).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all ProjectMember records for this user
    const userWithProjects = await User.aggregate([
        {
            $match: {
                _id: userObjectId
            }
        },
        {
            $project: {
                password: 0,
                refreshToken: 0,
                emailVerificationToken: 0,
                emailVerificationTokenExpiry: 0,
            }
        },
        {
            $lookup: {
                from: "projectmembers",
                localField: "_id",
                foreignField: "user",
                as: "projectMemberships"
            }
        },
        {
            $project: {
                username: 1,
                email: 1,
                fullname: 1,
                createdAt: 1,
                updatedAt: 1,
                projectMemberships: {
                    _id: 1,
                    role: 1,
                    createdAt: 1,
                    project: 1
                }
            }
        }
    ])

    if (!userWithProjects || userWithProjects.length === 0) {
        throw new ApiError(404, "User projects not found");
    }

    const populatedMemberships = await ProjectMember.find({
        _id: { $in: userWithProjects[0].projectMemberships.map(pm => pm._id) }
    })
        .populate({
            path: "project",
            select: "name description createdBy createdAt",
            populate: {
                path: "createdBy",
                select: "username email fullname"
            }
        })
        .select("_id role createdAt project")
        .lean();

    const userDetails = {
        ...userWithProjects[0],
        projectMemberships: populatedMemberships
    }

    const userStats = {
        totalProjects: populatedMemberships.length,
        rolesCount: populatedMemberships.reduce((acc, pm) => {
            acc[pm.role] = (acc[pm.role] || 0) + 1;
            return acc;
        }, {})
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: userDetails, stats: userStats },
                "User retrieved successfully",
            )
        )
})

const updateUser = asyncHandler(async (req, res) => {
//     Get userId and update fields from request
// Find user by ID

// Allow updating:
//   - username
//   - email
//   - isEmailVerified (force verify)

// Update user
// Return updated user

    const { userId } = req.params;
    const { username, email, isEmailVerified } = req.body;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID format");
    }

    // Validate required fields
    if (!username && !email && typeof isEmailVerified !== "boolean") {
        throw new ApiError(400, "At least one field (username, email, isEmailVerified) is required to update");
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check for username uniqueness
    if (username && username !== user.username) {
        const existingUser = await User.findOne({
            username: username.toLowerCase(),
            _id: { $ne: userId }
        });

        if (existingUser) {
            throw new ApiError(409, "Username is already taken");
        }
        user.username = username.toLowerCase();
    }

    // Check for email uniqueness
    if (email && email !== user.email) {
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
            _id: { $ne: userId }
        });

        if (existingUser) {
            throw new ApiError(409, "Email is already registered");
        }
        user.email = email.toLowerCase();
    }

    // Update email verification status
    if (typeof isEmailVerified === "boolean") {
        user.isEmailVerified = isEmailVerified;
        
        // If unverifying email, clear verification tokens
        if (!isEmailVerified) {
            user.emailVerificationToken = undefined;
            user.emailVerificationTokenExpiry = undefined;
        }
    }

    // Save updated user
    await user.save();

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(userId).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "User updated successfully",
            )
        )
})

const deleteUser = asyncHandler(async (req, res) => {
//     Get userId from params
// Find user

// Cascade delete:
//   - Remove all ProjectMember records for this user
//   - Reassign or delete tasks assigned to this user
//   - Remove notes created by this user
//   - Delete the user account

// Return success

    const { userId } = req.params;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID format");
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if trying to delete self
    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "Cannot delete your own account");
    }

    // Check if trying to delete super admin (additional safety)
    if (user.isSuperAdmin) {
        throw new ApiError(400, "Cannot delete super admin user. Remove super admin privileges first.");
    }

    // Log this deletion operation
    console.warn(`User deletion initiated for user ID: ${userId}, Username: ${user.username}, Email: ${user.email}`);

    // Cascade delete operations
    // 1. Remove all ProjectMember records for this user
    const projectMembersDeleted = await ProjectMember.deleteMany({ user: userId });
    
    // 2. Delete all tasks assigned to this user
    const tasksDeleted = await mongoose.model("Task").deleteMany({ assignedTo: userId });
    
    // 3. Delete all tasks assigned by this user
    const tasksAssignedDeleted = await mongoose.model("Task").deleteMany({ assignedBy: userId });
    
    // 4. Delete all subtasks created by this user
    const subTasksDeleted = await mongoose.model("SubTask").deleteMany({ createdBy: userId });
    
    // 5. Delete all notes created by this user
    const notesDeleted = await mongoose.model("ProjectNote").deleteMany({ createdBy: userId });

    // 6. Delete the user account
    await User.findByIdAndDelete(userId);

    // Return success with deletion statistics
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    userId,
                    username: user.username,
                    email: user.email,
                    deletionStats: {
                        projectMemberships: projectMembersDeleted.deletedCount,
                        assignedTasks: tasksDeleted.deletedCount,
                        assignedByTasks: tasksAssignedDeleted.deletedCount,
                        subTasks: subTasksDeleted.deletedCount,
                        notes: notesDeleted.deletedCount
                    }
                },
                "User and all associated data deleted successfully",
            )
        )
})

const getAllProjectsAdmin = asyncHandler(async (req, res) => {
//     Get all projects from Project collection
// For each project:
//   - Count members
//   - Count tasks
//   - Count notes
//   - Show project admin(s)
//   - Show created by user

// Sort by creation date
// Return projects with stats

    let projects = await mongoose.model("Project").aggregate([
        // 1. Lookup ProjectMember to count members and get admins
        {
            $lookup: {
                from: "projectmembers",
                localField: "_id",
                foreignField: "project",
                as: "members"
            }
        },
        {
            $addFields: {
                memberCount: {
                    $size: "$members"
                },
                admins: {
                    $filter: {
                        input: "$members",
                        as: "member",
                        cond: { $eq: ["$$member.role", "project_admin"] }
                    }
                }
            }
        },
        // 2. Lookup Task to count tasks and get task status distribution
        {
            $lookup: {
                from: "tasks",
                localField: "_id",
                foreignField: "project",
                as: "tasks"
            }
        },
        {
            $addFields: {
                taskCount: { $size: "$tasks" },
                todoTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.TODO] }
                        }
                    }
                },
                inProgressTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.IN_PROGRESS] }
                        }
                    }
                },
                doneTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.DONE] }
                        }
                    }
                }
            }
        },
        // 3. Lookup ProjectNote to count notes
        {
            $lookup: {
                from: "projectnotes",
                localField: "_id",
                foreignField: "project",
                as: "notes"
            }
        },
        {
            $addFields: {
                noteCount: { $size: "$notes" }
            }
        },
        // 4. Lookup User to get createdBy details
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "creator"
            }
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true
            }
        },
        // 5. Lookup SubTask to count total subtasks
        {
            $lookup: {
                from: "subtasks",
                localField: "tasks._id",
                foreignField: "task",
                as: "allSubtasks"
            }
        },
        {
            $addFields: {
                subTaskCount: { $size: "$allSubtasks" },
                completedSubTasks: {
                    $size: {
                        $filter: {
                            input: "$allSubtasks",
                            as: "subtask",
                            cond: { $eq: ["$$subtask.isCompleted", true] }
                        }
                    }
                }
            }
        },
        // 6. Project final fields with enhanced information
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                memberCount: 1,
                taskCount: 1,
                todoTasks: 1,
                inProgressTasks: 1,
                doneTasks: 1,
                noteCount: 1,
                subTaskCount: 1,
                completedSubTasks: 1,
                completionRate: {
                    $cond: [
                        { $eq: ["$subTaskCount", 0] },
                        0,
                        { $divide: ["$completedSubTasks", "$subTaskCount"] }
                    ]
                },
                admins: {
                    $map: {
                        input: "$admins",
                        as: "admin",
                        in: {
                            user: "$$admin.user",
                            role: "$$admin.role",
                            joinedAt: "$$admin.createdAt"
                        }
                    }
                },
                creator: {
                    _id: 1,
                    username: 1,
                    email: 1
                }
            }
        },
        // 7. Sort by creation date
        {
            $sort: { createdAt: -1 }
        }
    ]);

    // Handle case when no projects exist
    if (!projects) {
        projects = [];
    }

    // Calculate summary statistics
    const summaryStats = {
        totalProjects: projects.length,
        totalMembers: projects.reduce((sum, project) => sum + project.memberCount, 0),
        totalTasks: projects.reduce((sum, project) => sum + project.taskCount, 0),
        totalNotes: projects.reduce((sum, project) => sum + project.noteCount, 0),
        totalSubTasks: projects.reduce((sum, project) => sum + (project.subTaskCount || 0), 0),
        averageCompletionRate: projects.length > 0 
            ? projects.reduce((sum, project) => sum + (project.completionRate || 0), 0) / projects.length
            : 0
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    projects,
                    summary: summaryStats
                },
                "Projects retrieved successfully",
            )
        )
})

const getProjectStats = asyncHandler(async (req, res) => {
//     Get projectId from params
// Find project

// Calculate:
//   - Total members
//   - Total tasks (by status: todo, in_progress, done)
//   - Total subtasks and completion rate
//   - Total notes
//   - Most active users (who created most tasks/notes)
//   - Project timeline (created, last activity)

// Return statistics object

    const { projectId } = req.params;

    // Validate project ID format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    const projectObjectId = new Types.ObjectId(projectId);

    // Find project
    const project = await mongoose.model("Project").findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Aggregate comprehensive statistics
    const stats = await mongoose.model("Project").aggregate([
        {
            $match: { _id: projectObjectId }
        },
        // 1. Lookup ProjectMember to count members and get member details
        {
            $lookup: {
                from: "projectmembers",
                localField: "_id",
                foreignField: "project",
                as: "members"
            }
        },
        {
            $addFields: {
                totalMembers: { $size: "$members" }
            }
        },
        // 2. Lookup Task to get detailed task statistics
        {
            $lookup: {
                from: "tasks",
                localField: "_id",
                foreignField: "project",
                as: "tasks"
            }
        },
        {
            $addFields: {
                totalTasks: { $size: "$tasks" },
                todoTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.TODO] }
                        }
                    }
                },
                inProgressTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.IN_PROGRESS] }
                        }
                    }
                },
                doneTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.DONE] }
                        }
                    }
                }
            }
        },
        // 3. Lookup ProjectNote to count notes
        {
            $lookup: {
                from: "projectnotes",
                localField: "_id",
                foreignField: "project",
                as: "notes"
            }
        },
        {
            $addFields: {
                totalNotes: { $size: "$notes" }
            }
        },
        // 4. Lookup SubTask to get subtask statistics
        {
            $lookup: {
                from: "subtasks",
                localField: "tasks._id",
                foreignField: "task",
                as: "allSubtasks"
            }
        },
        {
            $addFields: {
                totalSubTasks: { $size: "$allSubtasks" },
                completedSubTasks: {
                    $size: {
                        $filter: {
                            input: "$allSubtasks",
                            as: "subtask",
                            cond: { $eq: ["$$subtask.isCompleted", true] }
                        }
                    }
                }
            }
        },
        // 5. Calculate completion rate
        {
            $addFields: {
                completionRate: {
                    $cond: [
                        { $eq: ["$totalSubTasks", 0] },
                        0,
                        { $divide: ["$completedSubTasks", "$totalSubTasks"] }
                    ]
                }
            }
        },
        // 6. Identify most active users (who created most tasks/notes)
        {
            $lookup: {
                from: "users",
                localField: "tasks.assignedTo",
                foreignField: "_id",
                as: "taskAssignees"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "notes.createdBy",
                foreignField: "_id",
                as: "noteCreators"
            }
        },
        // 7. Project final detailed statistics
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalMembers: 1,
                totalTasks: 1,
                todoTasks: 1,
                inProgressTasks: 1,
                doneTasks: 1,
                totalNotes: 1,
                totalSubTasks: 1,
                completedSubTasks: 1,
                completionRate: 1,
                // Most active users based on task assignments and note creation
                mostActiveUsers: {
                    $concatArrays: ["$taskAssignees", "$noteCreators"]
                }
            }
        }
    ]);

    // Process the statistics for a cleaner response
    const projectStats = stats[0] || {};
    
    // Add timeline information
    if (projectStats.createdAt) {
        projectStats.projectAge = Date.now() - new Date(projectStats.createdAt).getTime();
    }
    
    // Calculate task distribution percentage
    if (projectStats.totalTasks > 0) {
        projectStats.taskDistribution = {
            todoPercentage: (projectStats.todoTasks / projectStats.totalTasks) * 100,
            inProgressPercentage: (projectStats.inProgressTasks / projectStats.totalTasks) * 100,
            donePercentage: (projectStats.doneTasks / projectStats.totalTasks) * 100
        };
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projectStats,
                "Project statistics retrieved successfully"
            )
        );
})

const getSystemStats = asyncHandler(async (req, res) => {
//     Calculate:
//   - Total users
//   - Total projects
//   - Total tasks
//   - Total notes
//   - Users registered today/this week/this month
//   - Active projects (with recent activity)
//   - Inactive projects
//   - Storage usage (if tracking files)

// Return dashboard statistics

    const User = mongoose.model("User");
    const Project = mongoose.model("Project");
    const Task = mongoose.model("Task");
    const ProjectNote = mongoose.model("ProjectNote");
    const SubTask = mongoose.model("SubTask");
    const ProjectMember = mongoose.model("ProjectMember");
    
    const now = new Date();
    
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalNotes = await ProjectNote.countDocuments();
    const totalSubTasks = await SubTask.countDocuments();
    const totalProjectMemberships = await ProjectMember.countDocuments();
    
    // User registration statistics
    const usersToday = await User.countDocuments({
        createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
    });
    
    const usersThisWeek = await User.countDocuments({
        createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        }
    });
    
    const usersThisMonth = await User.countDocuments({
        createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
    });
    
    // Unverified users
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });
    
    // Project activity statistics
    // Define active projects as those with tasks or notes updated in the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activeProjectIdsFromTasks = await Task.distinct("project", {
        updatedAt: { $gte: thirtyDaysAgo }
    });
    
    const activeProjectIdsFromNotes = await ProjectNote.distinct("project", {
        updatedAt: { $gte: thirtyDaysAgo }
    });
    
    const activeProjectIds = Array.from(new Set([...activeProjectIdsFromTasks, ...activeProjectIdsFromNotes]));
    const activeProjects = activeProjectIds.length;
    const inactiveProjects = totalProjects - activeProjects;
    
    // Task status distribution
    const todoTasks = await Task.countDocuments({ status: TaskStatusEnum.TODO });
    const inProgressTasks = await Task.countDocuments({ status: TaskStatusEnum.IN_PROGRESS });
    const doneTasks = await Task.countDocuments({ status: TaskStatusEnum.DONE });
    
    // Subtask completion statistics
    const completedSubTasks = await SubTask.countDocuments({ isCompleted: true });
    const pendingSubTasks = totalSubTasks - completedSubTasks;
    
    const completionRate = totalSubTasks > 0 
        ? (completedSubTasks / totalSubTasks) * 100 
        : 0;
    
    // Average project statistics
    const avgMembersPerProject = totalProjects > 0 
        ? totalProjectMemberships / totalProjects 
        : 0;
    
    const avgTasksPerProject = totalProjects > 0 
        ? totalTasks / totalProjects 
        : 0;
    
    const avgNotesPerProject = totalProjects > 0 
        ? totalNotes / totalProjects 
        : 0;
    
    // Recently created entities (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentProjects = await Project.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentTasks = await Task.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentNotes = await ProjectNote.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    });
    
    // System statistics object
    const systemStats = {
        // Basic counts
        totalUsers,
        totalProjects,
        totalTasks,
        totalNotes,
        totalSubTasks,
        totalProjectMemberships,
        
        // User statistics
        usersToday,
        usersThisWeek,
        usersThisMonth,
        unverifiedUsers,
        
        // Project activity
        activeProjects,
        inactiveProjects,
        
        // Task statistics
        todoTasks,
        inProgressTasks,
        doneTasks,
        
        // Subtask statistics
        completedSubTasks,
        pendingSubTasks,
        completionRate,
        
        // Averages
        avgMembersPerProject: parseFloat(avgMembersPerProject.toFixed(2)),
        avgTasksPerProject: parseFloat(avgTasksPerProject.toFixed(2)),
        avgNotesPerProject: parseFloat(avgNotesPerProject.toFixed(2)),
        
        // Recent activity
        recentProjects,
        recentTasks,
        recentNotes,
        
        // Timestamp
        generatedAt: new Date()
    };
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                systemStats,
                "System statistics retrieved successfully"
            )
        ); 
})

export {
    getAllUsers,
    getUserById,
    updateUser, 
    deleteUser,
    getAllProjectsAdmin,
    getProjectStats,
    getSystemStats
};