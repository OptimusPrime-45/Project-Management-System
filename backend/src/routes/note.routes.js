import { Router } from "express";
import { getAllNotes,
    createNote,
    getNoteById,
    updateNote,
    deleteNote } from "../controllers/note.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { checkProjectAccess } from "../middlewares/project.middlewares.js";

const router = Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Note routes under projects
// Apply project access control middleware for project-specific routes
router.use("/:projectId", checkProjectAccess);

// Note routes
router.get("/:projectId/notes", getAllNotes);
router.post("/:projectId/notes", createNote);
router.get("/:projectId/notes/:noteId", getNoteById);
router.put("/:projectId/notes/:noteId", updateNote);
router.delete("/:projectId/notes/:noteId", deleteNote);

export default router;