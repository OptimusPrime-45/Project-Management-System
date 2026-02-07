import mongoose from "mongoose";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";

const getAllNotes = asyncHandler(async (req, res) => {
//     IF super admin:
//   Get all notes for project
// ELSE:
//   Check ProjectMember for access
//   Get all notes

// Return notes

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

    // Get all notes for the project
    const notes = await ProjectNote.find({ project: projectId })
        .populate("createdBy", "username email fullname avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { 
                    notes,
                    count: notes.length
                },
                "Notes retrieved successfully"
            )
        );
})

const createNote = asyncHandler(async (req, res) => {
//     IF super admin:
//   Allow creation
// ELSE:
//   Check ProjectMember with role "project_admin"

// Create note
// Return note

    const { projectId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;
    const { content } = req.body;

    // Validate required fields
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Note content is required");
    }

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    // Check access permissions - all project members can create notes
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }
        // All project members (both project_admin and member) can create notes
    }

    // Verify project exists
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Create new note
    const newNote = new ProjectNote({
        project: projectId,
        content: content.trim(),
        createdBy: userId
    });

    await newNote.save();

    // Populate user details
    const populatedNote = await ProjectNote.findById(newNote._id)
        .populate("createdBy", "username email fullname avatar");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { note: populatedNote },
                "Note created successfully"
            )
        );
})

const getNoteById = asyncHandler(async (req, res) => {
//     IF super admin:
//   Return note directly
// ELSE:
//   Check ProjectMember for access
//   Return note

    const { projectId, noteId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId and noteId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, "Invalid project ID or note ID format");
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

    // Get note by ID
    const note = await ProjectNote.findOne({ _id: noteId, project: projectId });

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    // Populate user details
    const populatedNote = await ProjectNote.findById(noteId)
        .populate("createdBy", "username email fullname avatar");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { note: populatedNote },
                "Note retrieved successfully"
            )
        );
})

const updateNote = asyncHandler(async (req, res) => {
//     IF super admin:
//   Allow update
// ELSE:
//   Check ProjectMember with role "project_admin"

// Update note
// Return updated note

    const { projectId, noteId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;
    const { content } = req.body;

    // Validate required fields
    if (content === undefined || content === null) {
        throw new ApiError(400, "Note content is required");
    }

    // Validate projectId and noteId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, "Invalid project ID or note ID format");
    }

    // Check access permissions - only project_admin and super_admin can update notes
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(403, "Forbidden: Only project admins can update notes");
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Update note
    const note = await ProjectNote.findOneAndUpdate(
        { _id: noteId, project: projectId },
        { content: content.trim() },
        { new: true }
    );

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    // Populate user details
    const populatedNote = await ProjectNote.findById(noteId)
        .populate("createdBy", "username email fullname avatar");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { note: populatedNote },
                "Note updated successfully"
            )
        );
})

const deleteNote = asyncHandler(async (req, res) => {
//     IF super admin:
//   Allow deletion
// ELSE:
//   Check ProjectMember with role "project_admin"

// Delete note
// Return success

    const { projectId, noteId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId and noteId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, "Invalid project ID or note ID format");
    }

    // Check access permissions - only project_admin and super_admin can delete notes
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({ user: userId, project: projectId });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        if (membership.role !== UserRolesEnum.PROJECT_ADMIN) {
            throw new ApiError(403, "Forbidden: Only project admins can delete notes");
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Verify note exists before deletion
    const existingNote = await ProjectNote.findOne({ _id: noteId, project: projectId });
    
    if (!existingNote) {
        throw new ApiError(404, "Note not found");
    }

    // Delete note
    await ProjectNote.findByIdAndDelete(noteId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { noteId },
                "Note deleted successfully"
            )
        );
})

export {
    getAllNotes,
    createNote,
    getNoteById,
    updateNote,
    deleteNote
} 