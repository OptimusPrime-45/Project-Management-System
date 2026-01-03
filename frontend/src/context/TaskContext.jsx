import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
} from "../api/tasks";

const TaskContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState(null);

  const fetchTasks = useCallback(async (projectId) => {
    if (!projectId) return;
    setTaskLoading(true);
    setTaskError(null);
    try {
      const payload = await getAllTasks(projectId);
      const normalized = Array.isArray(payload?.tasks)
        ? payload.tasks
        : Array.isArray(payload)
        ? payload
        : [];
      setTasks(normalized);
    } catch (error) {
      setTaskError(error.response?.data?.message || "Failed to fetch tasks");
      setTasks([]);
    } finally {
      setTaskLoading(false);
    }
  }, []);

  const fetchTaskDetails = useCallback(async (projectId, taskId) => {
    if (!projectId || !taskId) return;
    setTaskLoading(true);
    setTaskError(null);
    try {
      const payload = await getTaskById(projectId, taskId);
      const taskData = payload?.task ?? payload ?? null;
      if (taskData) {
        setSelectedTask({
          ...taskData,
          subTasks: payload?.subTasks ?? taskData.subTasks ?? [],
          totalSubTasks: payload?.totalSubTasks ?? taskData.totalSubTasks,
          completedSubTasks: payload?.completedSubTasks ?? taskData.completedSubTasks,
        });
      }
      return { success: true, task: taskData };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch task";
      setTaskError(message);
      return { success: false, message };
    } finally {
      setTaskLoading(false);
    }
  }, []);

  const handleTaskMutation = useCallback(
    async (mutationFn, projectId, ...args) => {
      if (!projectId) {
        return { success: false, message: "Project ID is required" };
      }
      setTaskLoading(true);
      setTaskError(null);
      try {
        const result = await mutationFn(projectId, ...args);
        await fetchTasks(projectId);
        return { success: true, result };
      } catch (error) {
        const message = error.response?.data?.message || "Task operation failed";
        setTaskError(message);
        return { success: false, message };
      } finally {
        setTaskLoading(false);
      }
    },
    [fetchTasks]
  );

  const addTask = useCallback(
    (projectId, payload) => handleTaskMutation(createTask, projectId, payload),
    [handleTaskMutation]
  );

  const editTask = useCallback(
    (projectId, taskId, payload) => handleTaskMutation(updateTask, projectId, taskId, payload),
    [handleTaskMutation]
  );

  const removeTask = useCallback(
    (projectId, taskId) => handleTaskMutation(deleteTask, projectId, taskId),
    [handleTaskMutation]
  );

  const addSubTask = useCallback(
    (projectId, taskId, payload) => handleTaskMutation(createSubTask, projectId, taskId, payload),
    [handleTaskMutation]
  );

  const editSubTask = useCallback(
    (projectId, taskId, subTaskId, payload) =>
      handleTaskMutation(updateSubTask, projectId, taskId, subTaskId, payload),
    [handleTaskMutation]
  );

  const removeSubTask = useCallback(
    (projectId, taskId, subTaskId) =>
      handleTaskMutation(deleteSubTask, projectId, taskId, subTaskId),
    [handleTaskMutation]
  );

  const value = useMemo(() => ({
    tasks,
    selectedTask,
    taskLoading,
    taskError,
    fetchTasks,
    fetchTaskDetails,
    addTask,
    editTask,
    removeTask,
    addSubTask,
    editSubTask,
    removeSubTask,
    setSelectedTask,
  }), [
    tasks,
    selectedTask,
    taskLoading,
    taskError,
    fetchTasks,
    fetchTaskDetails,
    addTask,
    editTask,
    removeTask,
    addSubTask,
    editSubTask,
    removeSubTask,
  ]);

  return (
    <TaskContext.Provider value={value}>
        {children}
    </TaskContext.Provider>
  );
};
