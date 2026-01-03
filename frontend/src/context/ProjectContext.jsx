import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
    getAllProjects as fetchProjectsApi,
    getProjectById as fetchProjectByIdApi,
    createProject as createProjectApi,
    updateProject as updateProjectApi,
    deleteProject as deleteProjectApi,
    getProjectMembers,
    addProjectMember,
    updateMemberRole,
    removeProjectMember,
    leaveProject as leaveProjectApi,
} from "../api/projects";

const ProjectContext = createContext();

// Custom hook to use the ProjectContext
export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProjects must be used within a ProjectProvider");
    }
    return context;
}

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentProject, setCurrentProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberError, setMemberError] = useState(null);

    const ensureProjectList = (payload) => {
        if (Array.isArray(payload)) {
            return payload;
        }
        if (Array.isArray(payload?.projects)) {
            return payload.projects;
        }
        return [];
    };

    const ensureProject = (payload) => payload?.project ?? payload ?? null;

    const ensureMemberList = (payload) => {
        if (Array.isArray(payload?.members)) {
            return payload.members;
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        return [];
    };

    // Fetch all projects 
    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchProjectsApi();
            const projectList = ensureProjectList(response);
            setProjects(projectList);
            setCurrentProject((prev) => prev ?? projectList[0] ?? null);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to fetch projects");
        } finally {
            setLoading(false);
        }
    }, []);

    // Get project by ID
    const getProjectDetails = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchProjectByIdApi(id);
            console.log("getProjectById API Response:", response);
            const project = ensureProject(response);
            console.log("Extracted project:", project);
            setCurrentProject(project);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to fetch project details");
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new project
    const addProject = useCallback(async (projectData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await createProjectApi(projectData);
            const project = ensureProject(response);
            if (project) {
                setProjects((prevProjects) => [...prevProjects, project]);
                setCurrentProject((prev) => prev ?? project);
            }
            return { success: true, project };
        } catch (error) {
            setError(error.response?.data?.message || "Failed to create project");
            return { success: false };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update an existing project
    const editProject = useCallback(async (id, projectData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await updateProjectApi(id, projectData);
            const updatedProject = ensureProject(response);
            setProjects((prevProjects) =>
                prevProjects.map((proj) => ((proj.id ?? proj._id) === id ? updatedProject : proj))
            );
            setCurrentProject((prev) => ((prev?.id ?? prev?._id) === id ? updatedProject : prev));
            return { success: true, project: updatedProject };
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update project");
            return { success: false };
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete a project
    const removeProject = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            await deleteProjectApi(id);
            setProjects((prevProjects) => prevProjects.filter((proj) => (proj.id ?? proj._id) !== id));
            setCurrentProject((prev) => ((prev?.id ?? prev?._id) === id ? null : prev));
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || "Failed to delete project");
            return { success: false };
        } finally{
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const clearCurrentProject = () => {
        setCurrentProject(null);
    }

    const fetchProjectMembersList = useCallback(async (projectId) => {
        if (!projectId) return;
        setMembersLoading(true);
        setMemberError(null);
        try {
            const response = await getProjectMembers(projectId);
            const memberList = ensureMemberList(response);
            setMembers(memberList);
            return { success: true, members: memberList };
        } catch (err) {
            const message = err.response?.data?.message || "Failed to load members";
            setMemberError(message);
            return { success: false, message };
        } finally {
            setMembersLoading(false);
        }
    }, []);

    const addMember = useCallback(async (projectId, payload) => {
        if (!projectId) return { success: false, message: "Project ID required" };
        try {
            const response = await addProjectMember(projectId, payload);
            const newMember = response?.member ?? response ?? null;
            await fetchProjectMembersList(projectId);
            return { success: true, member: newMember };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to add member" };
        }
    }, [fetchProjectMembersList]);

    const updateMember = useCallback(async ({ projectId, userId, role }) => {
        if (!projectId || !userId) {
            return { success: false, message: "Missing identifiers" };
        }
        try {
            await updateMemberRole(projectId, userId, role);
            await fetchProjectMembersList(projectId);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to update member" };
        }
    }, [fetchProjectMembersList]);

    const removeMember = useCallback(async (projectId, userId) => {
        if (!projectId || !userId) {
            return { success: false, message: "Missing identifiers" };
        }
        try {
            await removeProjectMember(projectId, userId);
            setMembers((prev) => prev.filter((member) => (member.id ?? member._id) !== userId));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to remove member" };
        }
    }, []);

    const leaveProject = useCallback(async (projectId) => {
        if (!projectId) {
            return { success: false, message: "Project ID required" };
        }
        try {
            await leaveProjectApi(projectId);
            // Remove project from list
            setProjects((prev) => prev.filter((p) => (p._id || p.id) !== projectId));
            if (currentProject && (currentProject._id || currentProject.id) === projectId) {
                setCurrentProject(null);
            }
            return { success: true, message: "You have left the project" };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to leave project" };
        }
    }, [currentProject]);

    const value = useMemo(() => ({
        projects,
        currentProject,
        loading,
        error,
        fetchProjects,
        getProjectById: getProjectDetails,
        addProject,
        editProject,
        removeProject,
        clearCurrentProject,
        members,
        membersLoading,
        memberError,
        fetchProjectMembers: fetchProjectMembersList,
        addMember,
        updateMember,
        removeMember,
        leaveProject,
    }), [
        projects,
        currentProject,
        loading,
        error,
        fetchProjects,
        getProjectDetails,
        addProject,
        editProject,
        removeProject,
        clearCurrentProject,
        members,
        membersLoading,
        memberError,
        fetchProjectMembersList,
        addMember,
        updateMember,
        removeMember,
        leaveProject,
    ]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}