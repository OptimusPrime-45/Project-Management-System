import api from "./axios";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const getOwnProjects = async () => {
    const response = await api.get("/users/projects");
    return unwrap(response);
};

export const updateOwnProfile = async (userData) => {
    const response = await api.patch("/users/profile", userData);
    return unwrap(response);
};

export const searchUsers = async (query, projectId = null) => {
    const params = { query };
    if (projectId) {
        params.projectId = projectId;
    }
    const response = await api.get("/users/search", { params });
    return unwrap(response);
};