import api from "./axios.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const getAllProjects = async () => {
  const response = await api.get("/projects");
  return unwrap(response);
};

export const getProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return unwrap(response);
};

export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);
  return unwrap(response);
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/projects/${projectId}`, projectData);
  return unwrap(response);
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return unwrap(response);
};

export const addProjectMember = async (projectId, memberData) => {
  const response = await api.post(`/projects/${projectId}/members`, memberData);
  return unwrap(response);
};

export const removeProjectMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members`, {
    data: { userId },
  });
  return unwrap(response);
};

export const getProjectMembers = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/members`);
  return unwrap(response);
};

export const updateMemberRole = async (projectId, userId, role) => {
  const response = await api.put(`/projects/${projectId}/members`, {
    userId,
    role,
  });
  return unwrap(response);
};

export const toggleProjectCompletion = async (projectId) => {
  const response = await api.patch(`/projects/${projectId}/toggle-completion`);
  return unwrap(response);
};

export const leaveProject = async (projectId) => {
  const response = await api.post(`/projects/${projectId}/leave`);
  return unwrap(response);
};
