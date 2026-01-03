import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllProjectsAdmin,
  getProjectStats,
  getSystemStats,
} from "../api/superAdmin";
import { deleteProject as deleteProjectApi } from "../api/projects";

const SuperAdminContext = createContext(null);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  }
  return context;
};

export const SuperAdminProvider = ({ children }) => {
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminProjects, setAdminProjects] = useState([]);
  const [adminProjectSummary, setAdminProjectSummary] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedAdminUserStats, setSelectedAdminUserStats] = useState(null);
  const [selectedAdminProject, setSelectedAdminProject] = useState(null);
  const [selectedAdminProjectStats, setSelectedAdminProjectStats] =
    useState(null);
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  const [superAdminError, setSuperAdminError] = useState(null);

  const handleRequest = useCallback(async (requestFn) => {
    setSuperAdminLoading(true);
    setSuperAdminError(null);
    try {
      const response = await requestFn();
      const payload = response?.data ?? response;
      return { success: true, data: payload, message: response?.message };
    } catch (error) {
      const message =
        error.response?.data?.message || "Super admin action failed";
      setSuperAdminError(message);
      toast.error(message);
      return { success: false, message };
    } finally {
      setSuperAdminLoading(false);
    }
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    const result = await handleRequest(() => getAllUsers());
    if (result.success) {
      setAdminUsers(Array.isArray(result.data) ? result.data : []);
    }
    return result;
  }, [handleRequest]);

  const fetchAdminProjects = useCallback(async () => {
    const result = await handleRequest(() => getAllProjectsAdmin());
    if (result.success) {
      const projectsPayload = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.projects)
        ? result.data.projects
        : [];
      setAdminProjects(projectsPayload);
      setAdminProjectSummary(result.data?.summary || null);
    }
    return result;
  }, [handleRequest]);

  const fetchSystemStatsData = useCallback(async () => {
    const result = await handleRequest(() => getSystemStats());
    if (result.success) {
      setSystemStats(result.data || null);
    }
    return result;
  }, [handleRequest]);

  const fetchAdminUserById = useCallback(
    async (userId) => {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }
      const result = await handleRequest(() => getUserById(userId));
      if (result.success) {
        setSelectedAdminUser(result.data?.user || result.data || null);
        setSelectedAdminUserStats(result.data?.stats || null);
      }
      return result;
    },
    [handleRequest]
  );

  const editAdminUser = useCallback(
    async (userId, payload) => {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }
      const result = await handleRequest(() => updateUser(userId, payload));
      if (result.success) {
        const updated = result.data?.user ?? result.data ?? null;
        setAdminUsers((prev) =>
          prev.map((user) =>
            user.id === userId || user._id === userId ? updated : user
          )
        );
        setSelectedAdminUser((prev) =>
          prev && (prev.id === userId || prev._id === userId) ? updated : prev
        );
      }
      return result;
    },
    [handleRequest]
  );

  const removeAdminUser = useCallback(
    async (userId) => {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }
      const result = await handleRequest(() => deleteUser(userId));
      if (result.success) {
        setAdminUsers((prev) =>
          prev.filter((user) => user.id !== userId && user._id !== userId)
        );
        let cleared = false;
        setSelectedAdminUser((prev) => {
          if (prev && (prev.id === userId || prev._id === userId)) {
            cleared = true;
            return null;
          }
          return prev;
        });
        if (cleared) {
          setSelectedAdminUserStats(null);
        }
      }
      return result;
    },
    [handleRequest]
  );

  const fetchProjectStatsData = useCallback(
    async (projectId) => {
      if (!projectId) {
        return { success: false, message: "Project ID is required" };
      }
      const result = await handleRequest(() => getProjectStats(projectId));
      if (result.success) {
        setSelectedAdminProjectStats(result.data || null);
      }
      return result;
    },
    [handleRequest]
  );

  const removeAdminProject = useCallback(
    async (projectId) => {
      if (!projectId) {
        return { success: false, message: "Project ID is required" };
      }
      const result = await handleRequest(() => deleteProjectApi(projectId));
      if (result.success) {
        setAdminProjects((prev) =>
          prev.filter(
            (project) => project.id !== projectId && project._id !== projectId
          )
        );
        setSelectedAdminProject((prev) => {
          if (prev && (prev.id === projectId || prev._id === projectId)) {
            setSelectedAdminProjectStats(null);
            return null;
          }
          return prev;
        });
      }
      return result;
    },
    [handleRequest]
  );

  const value = useMemo(() => ({
    adminUsers,
    adminProjects,
    adminProjectSummary,
    systemStats,
    selectedAdminUser,
    selectedAdminUserStats,
    selectedAdminProject,
    selectedAdminProjectStats,
    superAdminLoading,
    superAdminError,
    fetchAdminUsers,
    fetchAdminProjects,
    fetchSystemStats: fetchSystemStatsData,
    fetchAdminUserById,
    editAdminUser,
    removeAdminUser,
    fetchProjectStats: fetchProjectStatsData,
    setSelectedAdminUser,
    setSelectedAdminUserStats,
    setSelectedAdminProject,
    setSelectedAdminProjectStats,
    removeAdminProject,
  }), [
    adminUsers,
    adminProjects,
    adminProjectSummary,
    systemStats,
    selectedAdminUser,
    selectedAdminUserStats,
    selectedAdminProject,
    selectedAdminProjectStats,
    superAdminLoading,
    superAdminError,
    fetchAdminUsers,
    fetchAdminProjects,
    fetchSystemStatsData,
    fetchAdminUserById,
    editAdminUser,
    removeAdminUser,
    fetchProjectStatsData,
    removeAdminProject,
  ]);

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};
