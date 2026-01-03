import { Router } from "express";
import { getOwnProjects, updateOwnProfile, searchUsers } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Secure routes (require authentication)
router.route("/profile").patch(verifyJWT, updateOwnProfile);
router.route("/projects").get(verifyJWT, getOwnProjects);
router.route("/search").get(verifyJWT, searchUsers);

export default router;