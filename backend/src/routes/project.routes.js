import { Router } from "express";
import {
    getAllProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
    addProjectMember,
    updateMemberRole,
    removeMember,
    leaveProject,
    toggleProjectCompletion,
} from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { checkProjectAccess } from "../middlewares/project.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getAllProjects);
router.post("/", createProject);

// Project-specific routes with access control middleware
router.use("/:projectId", checkProjectAccess);

router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);
router.patch("/:projectId/toggle-completion", toggleProjectCompletion);
router.get("/:projectId/members", getProjectMembers);
router.post("/:projectId/members", addProjectMember);
router.put("/:projectId/members", updateMemberRole);
router.delete("/:projectId/members", removeMember);
router.post("/:projectId/leave", leaveProject);

export default router;
