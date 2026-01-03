import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["task_assigned", "task_updated", "project_updated", "note_added", "member_added", "role_changed"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        link: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
        },
        relatedProject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },
        relatedTask: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
        },
        relatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
