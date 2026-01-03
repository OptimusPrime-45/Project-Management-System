import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { getOwnProjects, updateOwnProfile } from "../api/user";
import { getCurrentUser } from "../api/auth";

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userProjects, setUserProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);

  const fetchUserProjects = useCallback(async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const response = await getOwnProjects();
      const projects = Array.isArray(response?.projects)
        ? response.projects
        : Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setUserProjects(projects);
      return { success: true, projects };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch projects";
      setUserError(message);
      return { success: false, message };
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const response = await getCurrentUser();
      const profileData = response?.data || null;
      setProfile(profileData);
      return { success: true, profile: profileData };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch profile";
      setUserError(message);
      return { success: false, message };
    } finally {
      setUserLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setUserLoading(true);
    setUserError(null);
    try {
      const response = await updateOwnProfile(profileData);
      const updatedProfile = response?.user ?? response ?? null;
      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile, message: response?.message };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      setUserError(message);
      return { success: false, message };
    } finally {
      setUserLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    userProjects,
    profile,
    userLoading,
    userError,
    fetchUserProjects,
    fetchProfile,
    updateProfile,
    setProfile,
  }), [
    userProjects,
    profile,
    userLoading,
    userError,
    fetchUserProjects,
    fetchProfile,
    updateProfile,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
