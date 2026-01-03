import api from "./axios.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const taskBase = (projectId) => `/projects/${projectId}/tasks`;

export const getAllTasks = async (projectId) => {
    const response = await api.get(taskBase(projectId));
    return unwrap(response);
};

export const getTaskById = async (projectId, taskId) => {
    const response = await api.get(`${taskBase(projectId)}/${taskId}`);
    return unwrap(response);
};

export const createTask = async (projectId, taskData) => {
    const response = await api.post(taskBase(projectId), taskData);
    return unwrap(response);
};

export const updateTask = async (projectId, taskId, taskData) => {
    const response = await api.put(`${taskBase(projectId)}/${taskId}`, taskData);
    return unwrap(response);
};

export const deleteTask = async (projectId, taskId) => {
    const response = await api.delete(`${taskBase(projectId)}/${taskId}`);
    return unwrap(response);
};

export const createSubTask = async (projectId, taskId, subTaskData) => {
    const response = await api.post(`${taskBase(projectId)}/${taskId}/subtasks`, subTaskData);
    return unwrap(response);
};

export const updateSubTask = async (projectId, taskId, subTaskId, subTaskData) => {
    const response = await api.put(`${taskBase(projectId)}/${taskId}/subtasks/${subTaskId}`, subTaskData);
    return unwrap(response);
};

export const deleteSubTask = async (projectId, taskId, subTaskId) => {
    const response = await api.delete(`${taskBase(projectId)}/${taskId}/subtasks/${subTaskId}`);
    return unwrap(response);
};

