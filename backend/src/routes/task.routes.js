import { Router } from 'express';
import { 
    getAllTasks, 
    createTask, 
    getTaskById, 
    updateTask, 
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask
} from "../controllers/task.controllers.js";
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { checkProjectAccess } from '../middlewares/project.middlewares.js';

const router = Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Task routes under projects
// Apply project access control middleware for project-specific routes
router.use("/:projectId", checkProjectAccess);

// Task routes
router.get("/:projectId/tasks", getAllTasks);
router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks/:taskId", getTaskById);
router.put("/:projectId/tasks/:taskId", updateTask);
router.delete("/:projectId/tasks/:taskId", deleteTask);

// SubTask routes
router.post("/:projectId/tasks/:taskId/subtasks", createSubTask);
router.put("/:projectId/tasks/:taskId/subtasks/:subTaskId", updateSubTask);
router.delete("/:projectId/tasks/:taskId/subtasks/:subTaskId", deleteSubTask);

export default router;