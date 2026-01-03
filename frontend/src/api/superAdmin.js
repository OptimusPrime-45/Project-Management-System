import api from './axios.js';

// User management
export const getAllUsers = async () => {
    const response = await api.get("/super-admin/users");
    return response.data;
};

export const getUserById = async (userId) => {
    const response = await api.get(`/super-admin/users/${userId}`);
    return response.data;
};

export const updateUser = async (userId, userData) => {
    const response = await api.patch(`/super-admin/users/${userId}`, userData);
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await api.delete(`/super-admin/users/${userId}`);
    return response.data;
};

// Project management
export const getAllProjectsAdmin = async () => {
    const response = await api.get("/super-admin/projects");
    return response.data;
};

export const getProjectStats = async (projectId) => {
    const response = await api.get(`/super-admin/projects/${projectId}/stats`);
    return response.data;
};

// System statistics
export const getSystemStats = async () => {
    const response = await api.get("/super-admin/stats");
    return response.data;
};