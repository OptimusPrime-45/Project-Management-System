import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAllProjectsAdmin,
    getProjectStats,
    getSystemStats,
} from "../controllers/superAdmin.controllers.js";
import { verifyJWT, verifySuperAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

// All super admin routes require both authentication and super admin privileges
router.use(verifyJWT, verifySuperAdmin);

// User management routes
router.route("/users").get(getAllUsers);
router.route("/users/:userId").get(getUserById);
router.route("/users/:userId").patch(updateUser);
router.route("/users/:userId").delete(deleteUser);

// Project management routes
router.route("/projects").get(getAllProjectsAdmin);
router.route("/projects/:projectId/stats").get(getProjectStats);

// System statistics route
router.route("/stats").get(getSystemStats);

export default router;