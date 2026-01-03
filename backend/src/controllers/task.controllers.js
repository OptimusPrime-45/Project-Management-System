import mongoose from "mongoose";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum } from "../utils/constants.js";
import { TaskStatusEnum } from "../utils/constants.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { createNotification } from "./notification.controllers.js";

const getAllTasks = asyncHandler(async (req, res) => {
//     IF super admin:
//   Verify project exists
//   Get all tasks  
// ELSE:
//   Check ProjectMember for access
//   Get all tasks

// Return tasks with subtask counts

    const { projectId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    // Check access permissions
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });
        
        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Get all tasks for the project with subtask counts
    const tasks = await Task.aggregate([
        {
            $match: { project: new mongoose.Types.ObjectId(projectId) }
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks"
            }
        },
        {
            $addFields: {
                totalSubTasks: { $size: "$subtasks" },
                completedSubTasks: {
                    $size: {
                        $filter: {
                            input: "$subtasks",
                            cond: { $eq: ["$$this.isCompleted", true] }
                        }
                    }
                }
            }
        },
        {
            $project: {
                subtasks: 0 // Remove subtasks array from result
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    // Populate assignedTo and assignedBy user details
    const populatedTasks = await Task.populate(tasks, [
        { path: "assignedTo", select: "username email fullname avatar" },
        { path: "assignedBy", select: "username email fullname avatar" }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { tasks: populatedTasks },
                "Tasks retrieved successfully"
            )
        );
})

const createTask = asyncHandler(async (req, res) => {
//     IF super admin:
//   Allow creation directly
// ELSE:
//   Check ProjectMember with role "project_admin"
  
// Validate assignedTo user is a member of the project (unless super admin is assigning)

// Create task
// Return task

    const { projectId } = req.params;
    const { title, description, assignedTo } = req.body;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate required fields
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Task title is required");
    }
    
    if (!assignedTo) {
        throw new ApiError(400, "assignedTo is required");
    }

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    // Check access permissions - only project_admin and super_admin can create tasks
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(403, "Forbidden: Only project admins can create tasks");
        }

        // Validate assignedTo user is a member of the project
        const assignedMembership = await ProjectMember.findOne({ user: assignedTo, project: projectId });

        if (!assignedMembership) {
            throw new ApiError(400, "Assigned user is not a member of the project");
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Create task
    const newTask = new Task({
        project: projectId,
        title: title.trim(),
        description: description?.trim() || "",
        assignedTo,
        assignedBy: userId,
        status: TaskStatusEnum.TODO
    });

    await newTask.save();

    // Populate assignedTo and assignedBy user details
    const populatedTask = await Task.findById(newTask._id)
        .populate("assignedTo", "username email fullname avatar")
        .populate("assignedBy", "username email fullname avatar");

    // Create notification for assigned user (if not assigning to self)
    if (assignedTo.toString() !== userId.toString()) {
        await createNotification({
            userId: assignedTo,
            type: "task_assigned",
            title: "New Task Assigned",
            message: `You have been assigned to "${title.trim()}" in ${project.name}`,
            link: `/projects/${projectId}?tab=tasks`,
            relatedProject: projectId,
            relatedTask: newTask._id,
            relatedUser: userId,
        });
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { task: populatedTask },
                "Task created successfully"
            )
        );
})

const getTaskById = asyncHandler(async (req, res) => {
//     IF super admin:
//   Verify task exists in project
//   Return task with subtasks
// ELSE:
//   Check ProjectMember for access
//   Return task with subtasks

    const { projectId, taskId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId and taskId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid project ID or task ID format");
    }

    // Check access permissions
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }
    }

    // Verify task exists in project
    const task = await Task.findOne({ _id: taskId, project: projectId });

    if (!task) {
        throw new ApiError(404, "Task not found in the specified project");
    }

    // Populate assignedTo and assignedBy user details
    const populatedTask = await Task.findById(taskId)
        .populate("assignedTo", "username email fullname avatar")
        .populate("assignedBy", "username email fullname avatar");

    // Get subtasks for the task with user details
    const subTasks = await SubTask.find({ task: taskId })
        .populate("assignedTo", "username email fullname avatar")
        .populate("createdBy", "username email fullname avatar");

    // Add subtask statistics
    const totalSubTasks = subTasks.length;
    const completedSubTasks = subTasks.filter(subTask => subTask.isCompleted).length;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                { 
                    task: populatedTask, 
                    subTasks,
                    totalSubTasks,
                    completedSubTasks
                },
                "Task retrieved successfully"
            )
        );
})

const updateTask = asyncHandler(async (req, res) => {
//     IF super admin:
//   Allow update directly
// ELSE:
//   Check ProjectMember with role "project_admin"

// Validate new assignee (if changed) is project member

// Update task
// Return updated task

    const { projectId, taskId } = req.params;
    const { title, description, assignedTo, status } = req.body;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId and taskId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid project ID or task ID format");
    }

    // Verify task exists
    const existingTask = await Task.findOne({ _id: taskId, project: projectId });
    if (!existingTask) {
        throw new ApiError(404, "Task not found in the specified project");
    }

    // Check access permissions
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        // Members can only update status, project_admin can update everything
        if (membership.role === UserRolesEnum.MEMBER) {
            // Members can only update status
            if (title !== undefined || description !== undefined || assignedTo !== undefined) {
                throw new ApiError(403, "Forbidden: Members can only update task status");
            }
        } else if (membership.role === UserRolesEnum.PROJECT_ADMIN) {
            // Only validate assignedTo if it's being changed
            if (assignedTo && assignedTo !== existingTask.assignedTo.toString()) {
                const assignedMembership = await ProjectMember.findOne({ user: assignedTo, project: projectId });

                if (!assignedMembership) {
                    throw new ApiError(400, "Assigned user is not a member of the project");
                }
            }
        }
    }

    // Prepare update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description?.trim() || "";
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;
    if (status !== undefined) updateFields.status = status;

    // Update task
    const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, project: projectId },
        updateFields,
        { new: true }
    );

    // Populate user details
    const populatedTask = await Task.findById(updatedTask._id)
        .populate("assignedTo", "username email fullname avatar")
        .populate("assignedBy", "username email fullname avatar");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { task: populatedTask },
                "Task updated successfully"
            )
        );
})

const deleteTask = asyncHandler(async (req, res) => {
//     IF super admin:
//   Allow deletion directly
// ELSE:
//   Check ProjectMember with role "project_admin"

// Delete task and cascade to subtasks
// Return success

    const { projectId, taskId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId and taskId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid project ID or task ID format");
    }

    // Verify task exists
    const existingTask = await Task.findOne({ _id: taskId, project: projectId });
    if (!existingTask) {
        throw new ApiError(404, "Task not found in the specified project");
    }

    // Check access permissions - only project_admin and super_admin can delete tasks
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(403, "Forbidden: Only project admins can delete tasks");
        }
    }

    // Delete task and cascade to subtasks
    await Task.findOneAndDelete({ _id: taskId, project: projectId });
    await SubTask.deleteMany({ task: taskId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { taskId },
                "Task and its subtasks deleted successfully"
            )
        );
})

const createSubTask = asyncHandler(async (req, res) => {
    //     IF super admin:
    //   Allow creation directly
    // ELSE:
    //   Check ProjectMember with role "project_admin"
    // Validate assignedTo user is a member of the project (unless super admin is assigning)
    // Create subTask
    // Return subTask

    const { projectId, taskId } = req.params;
    const { title, assignedTo } = req.body;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate required fields
    if (!title || title.trim() === "") {
        throw new ApiError(400, "SubTask title is required");
    }

    // Validate projectId and taskId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid project ID or task ID format");
    }

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Check access permissions - only project_admin and super_admin can create subtasks
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(403, "Forbidden: Only project admins can create subtasks");
        }
        
        // Validate assignedTo user is a member of the project (if assignedTo is provided)
        if (assignedTo) {
            const assignedMembership = await ProjectMember.findOne({ user: assignedTo, project: projectId });

            if (!assignedMembership) {
                throw new ApiError(400, "Assigned user is not a member of the project");
            }
        }
    }

    // Create subTask
    const newSubTask = new SubTask({
        task: taskId,
        title: title.trim(),
        ...(assignedTo && { assignedTo }),
        createdBy: userId,
        isCompleted: false
    });

    await newSubTask.save();

    // Populate user details
    const populatedSubTask = await SubTask.findById(newSubTask._id)
        .populate("assignedTo", "username email fullname avatar")
        .populate("assignedBy", "username email fullname avatar");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { subTask: populatedSubTask },
                "SubTask created successfully"
            )
        );
})

const updateSubTask = asyncHandler(async (req, res) => {
//     IF super admin:
//   Can update everything (title, isCompleted)
// ELSE IF project admin:
//   Can update everything (title, isCompleted)
// ELSE IF member:
//   Can ONLY update isCompleted
//   Cannot update title

    const { projectId, taskId, subTaskId } = req.params;
    const { title, isCompleted } = req.body;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId, taskId, and subTaskId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(subTaskId)) {
        throw new ApiError(400, "Invalid project ID, task ID, or subTask ID format");
    }
    // Check access permissions
    let membership = null;
    if (!isSuperAdmin) {
        membership = await ProjectMember.findOne({ user: userId, project: projectId });
    }
    if (!isSuperAdmin && !membership) {
        throw new ApiError(403, "Forbidden: You do not have access to this project");
    }

    // Determine update fields based on role
    const updateFields = {};
    if (isSuperAdmin || (membership && membership.role === UserRolesEnum.PROJECT_ADMIN)) {
        if (title !== undefined) {
            updateFields.title = title;
        }
        if (isCompleted !== undefined) {
            updateFields.isCompleted = isCompleted;
        }   
    } else {
        // Regular member can only update isCompleted
        if (isCompleted !== undefined) {
            updateFields.isCompleted = isCompleted;
        } else {
            throw new ApiError(403, "Forbidden: You can only update the completion status of the subtask");
        }
    }

    // Verify subTask exists
    const existingSubTask = await SubTask.findOne({ _id: subTaskId, task: taskId });
    if (!existingSubTask) {
        throw new ApiError(404, "SubTask not found");
    }

    // Update subTask
    const updatedSubTask = await SubTask.findOneAndUpdate(
        { _id: subTaskId, task: taskId },
        updateFields,
        { new: true }
    );

    // Populate user details
    const populatedSubTask = await SubTask.findById(updatedSubTask._id)
        .populate("assignedTo", "username email fullname avatar")
        .populate("createdBy", "username email fullname avatar");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subTask: populatedSubTask },
                "SubTask updated successfully"
            )
        );
})

const deleteSubTask = asyncHandler(async (req, res) => {
    //     IF super admin:
    //   Allow deletion directly
    // ELSE:
    //   Check ProjectMember with role "project_admin"
    // Delete subTask and cascade if needed
    // Return success

    const { projectId, taskId, subTaskId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId, taskId, and subTaskId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(subTaskId)) {
        throw new ApiError(400, "Invalid project ID, task ID, or subTask ID format");
    }

    // Check access permissions - only project_admin and super_admin can delete subtasks
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(403, "Forbidden: Only project admins can delete subtasks");
        }
    }

    // Verify subTask exists
    const existingSubTask = await SubTask.findOne({ _id: subTaskId, task: taskId });
    if (!existingSubTask) {
        throw new ApiError(404, "SubTask not found");
    }

    // Delete subTask
    await SubTask.findOneAndDelete({
        _id: subTaskId,
        task: taskId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "SubTask deleted successfully"
            )
        );
})

export {
    getAllTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask
}