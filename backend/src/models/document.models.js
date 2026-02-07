import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Index for efficient querying
documentSchema.index({ project: 1, createdAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
