import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { checkProjectAccess } from "../middlewares/project.middlewares.js";
import { documentUpload } from "../middlewares/multer.middleware.js";
import {
    getDocuments,
    uploadDocument,
    getDocumentById,
    deleteDocument,
    updateDocument,
} from "../controllers/document.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Project document routes
router.route("/:projectId/documents")
    .get(checkProjectAccess, getDocuments)
    .post(checkProjectAccess, documentUpload.single("file"), uploadDocument);

router.route("/:projectId/documents/:documentId")
    .get(checkProjectAccess, getDocumentById)
    .put(checkProjectAccess, updateDocument)
    .delete(checkProjectAccess, deleteDocument);

export default router;
