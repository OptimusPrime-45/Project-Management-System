import api from "./axios.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const noteBase = (projectId) => `/projects/${projectId}/notes`;

export const getAllNotes = async (projectId) => {
    const response = await api.get(noteBase(projectId));
    return unwrap(response);
};

export const createNote = async (projectId, noteData) => {
    const response = await api.post(noteBase(projectId), noteData);
    return unwrap(response);
};

export const getNoteById = async (projectId, noteId) => {
    const response = await api.get(`${noteBase(projectId)}/${noteId}`);
    return unwrap(response);
};

export const updateNote = async (projectId, noteId, noteData) => {
    const response = await api.put(`${noteBase(projectId)}/${noteId}`, noteData);
    return unwrap(response);
};

export const deleteNote = async (projectId, noteId) => {
    const response = await api.delete(`${noteBase(projectId)}/${noteId}`);
    return unwrap(response);
};