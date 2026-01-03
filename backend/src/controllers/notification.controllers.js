import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Notification } from "../models/notification.models.js";

// Get all notifications for current user
const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { limit = 20, read } = req.query;

    const filter = { user: userId };
    if (read !== undefined) {
        filter.read = read === "true";
    }

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate("relatedUser", "username email avatar")
        .populate("relatedProject", "name")
        .populate("relatedTask", "title");

    const unreadCount = await Notification.countDocuments({
        user: userId,
        read: false,
    });

    return res.status(200).json(
        new ApiResponse(200, {
            notifications,
            unreadCount,
        }, "Notifications retrieved successfully")
    );
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "All notifications marked as read")
    );
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Notification deleted successfully")
    );
});

// Helper function to create notification (used by other controllers)
export const createNotification = async ({
    userId,
    type,
    title,
    message,
    link,
    relatedProject,
    relatedTask,
    relatedUser,
}) => {
    try {
        await Notification.create({
            user: userId,
            type,
            title,
            message,
            link,
            relatedProject,
            relatedTask,
            relatedUser,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
