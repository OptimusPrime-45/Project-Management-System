import { Router } from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

router.route("/").get(getNotifications);
router.route("/mark-all-read").patch(markAllAsRead);
router.route("/:notificationId/read").patch(markAsRead);
router.route("/:notificationId").delete(deleteNotification);

export default router;
