import mongoose from "mongoose";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Document } from "../models/document.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

/**
 * Get all documents for a project
 * All project members can view documents
 */
const getDocuments = asyncHandler(async (req, res) => {
    const projectId = req.projectId;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    // Check project access for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Get all documents for the project
    const documents = await Document.find({ project: projectId })
        .populate("uploadedBy", "username email fullname avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, { documents }, "Documents retrieved successfully")
    );
});

/**
 * Upload a document to a project
 * All project members can upload documents
 */
const uploadDocument = asyncHandler(async (req, res) => {
    const projectId = req.projectId;
    const { name, description } = req.body;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }

    // Check project access for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Check if file was uploaded
    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    const file = req.file;
    const localFilePath = file.path;

    try {
        // Upload to Cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(localFilePath, `project-documents/${projectId}`);

        if (!cloudinaryResponse) {
            throw new ApiError(500, "Failed to upload file to cloud storage");
        }

        // Determine file type category
        let fileType = "other";
        const mimeType = file.mimetype;
        
        if (mimeType.startsWith("image/")) {
            fileType = "image";
        } else if (mimeType === "application/pdf") {
            fileType = "pdf";
        } else if (mimeType.includes("word") || mimeType.includes("document")) {
            fileType = "word";
        } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
            fileType = "excel";
        } else if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) {
            fileType = "powerpoint";
        } else if (mimeType.startsWith("text/")) {
            fileType = "text";
        } else if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) {
            fileType = "archive";
        }

        // Create document record
        const document = await Document.create({
            project: projectId,
            uploadedBy: userId,
            name: name || file.originalname,
            originalName: file.originalname,
            description: description || "",
            fileUrl: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id,
            fileType: fileType,
            fileSize: file.size,
            mimeType: file.mimetype,
        });

        // Populate uploader info for response
        const populatedDocument = await Document.findById(document._id)
            .populate("uploadedBy", "username email fullname avatar");

        return res.status(201).json(
            new ApiResponse(201, { document: populatedDocument }, "Document uploaded successfully")
        );
    } catch (error) {
        // Clean up local file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
});

/**
 * Get a single document by ID
 * All project members can view
 */
const getDocumentById = asyncHandler(async (req, res) => {
    const projectId = req.projectId;
    const { documentId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new ApiError(400, "Invalid document ID format");
    }

    // Check project access for non-super admin
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }
    }

    // Get the document
    const document = await Document.findOne({
        _id: documentId,
        project: projectId,
    }).populate("uploadedBy", "username email fullname avatar");

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { document }, "Document retrieved successfully")
    );
});

/**
 * Delete a document
 * Only super admin, project admin, or the uploader can delete
 */
const deleteDocument = asyncHandler(async (req, res) => {
    const projectId = req.projectId;
    const { documentId } = req.params;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new ApiError(400, "Invalid document ID format");
    }

    // Get the document
    const document = await Document.findOne({
        _id: documentId,
        project: projectId,
    });

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    // Check permissions
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        // Only project_admin or the uploader can delete
        const isUploader = document.uploadedBy.toString() === userId.toString();
        const isProjectAdmin = membership.role === "project_admin";

        if (!isUploader && !isProjectAdmin) {
            throw new ApiError(403, "Forbidden: Only project admins or the uploader can delete this document");
        }
    }

    // Delete from Cloudinary
    const resourceType = document.fileType === "image" ? "image" : "raw";
    await deleteFromCloudinary(document.publicId, resourceType);

    // Delete from database
    await Document.findByIdAndDelete(documentId);

    return res.status(200).json(
        new ApiResponse(200, null, "Document deleted successfully")
    );
});

/**
 * Update document metadata (name, description)
 * Only super admin, project admin, or the uploader can update
 */
const updateDocument = asyncHandler(async (req, res) => {
    const projectId = req.projectId;
    const { documentId } = req.params;
    const { name, description } = req.body;
    const { isSuperAdmin, _id: userId } = req.user;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new ApiError(400, "Invalid document ID format");
    }

    // Get the document
    const document = await Document.findOne({
        _id: documentId,
        project: projectId,
    });

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    // Check permissions
    if (!isSuperAdmin) {
        const membership = await ProjectMember.findOne({
            user: userId,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(403, "Forbidden: You do not have access to this project");
        }

        // Only project_admin or the uploader can update
        const isUploader = document.uploadedBy.toString() === userId.toString();
        const isProjectAdmin = membership.role === "project_admin";

        if (!isUploader && !isProjectAdmin) {
            throw new ApiError(403, "Forbidden: Only project admins or the uploader can update this document");
        }
    }

    // Update fields
    if (name) document.name = name.trim();
    if (description !== undefined) document.description = description.trim();

    await document.save();

    // Get populated document
    const updatedDocument = await Document.findById(documentId)
        .populate("uploadedBy", "username email fullname avatar");

    return res.status(200).json(
        new ApiResponse(200, { document: updatedDocument }, "Document updated successfully")
    );
});

export {
    getDocuments,
    uploadDocument,
    getDocumentById,
    deleteDocument,
    updateDocument,
};
