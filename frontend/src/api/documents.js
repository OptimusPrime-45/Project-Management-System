import api from "./axios";

/**
 * Get all documents for a project
 */
export const getDocuments = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/documents`);
    return response.data;
};

/**
 * Upload a document to a project
 */
export const uploadDocument = async (projectId, formData) => {
    const response = await api.post(`/projects/${projectId}/documents`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (projectId, documentId) => {
    const response = await api.get(`/projects/${projectId}/documents/${documentId}`);
    return response.data;
};

/**
 * Update document metadata
 */
export const updateDocument = async (projectId, documentId, data) => {
    const response = await api.put(`/projects/${projectId}/documents/${documentId}`, data);
    return response.data;
};

/**
 * Delete a document
 */
export const deleteDocument = async (projectId, documentId) => {
    const response = await api.delete(`/projects/${projectId}/documents/${documentId}`);
    return response.data;
};

/**
 * Download a document (opens in new tab)
 */
export const downloadDocument = (fileUrl, fileName) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
