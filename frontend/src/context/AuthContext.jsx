import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import {
  login as loginAPI,
  refreshAccessToken,
  getCurrentUser,
} from "../api/auth";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Helper function to check if token is expired or will expire soon
  const isTokenExpiringSoon = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - currentTime;
      // Refresh if token expires in less than 5 minutes
      return timeUntilExpiry < 300;
    } catch (error) {
      return true;
    }
  };

  // Logout function (defined early to avoid dependency issues)
  const logout = useCallback(() => {
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Clear user and token from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");

    // Update user state
    setUser(null);
    isRefreshingRef.current = false;

    return {
      success: true,
      message: "Logout successful",
    };
  }, []);

  const hydrateUserProfile = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      const profile = response?.data ?? response;
      if (profile) {
        localStorage.setItem("user", JSON.stringify(profile));
        setUser(profile);
        return { success: true, user: profile };
      }
      return { success: false, message: "No profile data found" };
    } catch (error) {
      console.error("Failed to hydrate current user:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Unable to fetch current user",
      };
    }
  }, []);

  // Function to refresh the access token
  const refreshToken = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      const { data } = await refreshAccessToken();

      // Decode the new token to get updated user info
      const decodedUser = jwtDecode(data.accessToken);

      // Get full user profile to include avatar and other fields
      const profileResponse = await getCurrentUser();
      const fullProfile = profileResponse?.data?.data ?? profileResponse?.data ?? {};

      // Merge decoded token data with full profile
      const updatedUser = { ...decodedUser, ...fullProfile };

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("accessToken", data.accessToken);

      // Update user state with merged data
      setUser(updatedUser);

      // Schedule next refresh
      scheduleTokenRefresh(data.accessToken);

      isRefreshingRef.current = false;
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      isRefreshingRef.current = false;
      // If refresh fails, logout the user
      logout();
      return false;
    }
  }, [logout, hydrateUserProfile]);

  // Schedule automatic token refresh
  const scheduleTokenRefresh = (token) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - currentTime;

      // Refresh 5 minutes before expiry (or immediately if already expired)
      const refreshTime = Math.max((timeUntilExpiry - 300) * 1000, 0);

      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    } catch (error) {
      console.error("Error scheduling token refresh:", error);
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");

    if (storedUser && storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;
        
        // If token is valid (not expired), set user
        if (decoded.exp > currentTime) {
          setUser(JSON.parse(storedUser));
          scheduleTokenRefresh(storedToken);
        } else {
          // Token expired, clear everything
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      } catch (error) {
        // Invalid token, clear everything
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const login = async (email, password) => {
    setIsAuthenticating(true);
    try {
      // Call the login API
      const response = await loginAPI({ email, password });
      
      // Backend returns { statusCode, data: { user, accessToken, refreshToken }, message, success }
      const payload = response?.data ?? response;
      
      if (!payload?.accessToken) {
        throw new Error("No access token received");
      }

      // Store token first
      localStorage.setItem("accessToken", payload.accessToken);

      // Decode the JWT to get user info
      const decodedUser = jwtDecode(payload.accessToken);

      // Store user
      localStorage.setItem("user", JSON.stringify(decodedUser));

      // Update user state
      setUser(decodedUser);

      // Schedule automatic token refresh
      scheduleTokenRefresh(payload.accessToken);

      // Hydrate user profile (this will now have the token available)
      const hydrated = await hydrateUserProfile();

      setIsAuthenticating(false);
      return {
        success: true,
        user: hydrated.success ? hydrated.user : decodedUser,
        message: "Login successful",
      };
    } catch (error) {
      console.error("Login failed:", error);
      // Clear any partial state on error
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticating(false);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  // Setup axios interceptor for 401 responses
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh the token
          const refreshed = await refreshToken();

          if (refreshed) {
            // Retry the original request with new token
            const newToken = localStorage.getItem("accessToken");
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticating, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { AuthContext };
