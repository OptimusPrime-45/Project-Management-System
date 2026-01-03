import api from './axios';

export const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
};

export const register = async (userInfo) => {
    const response = await api.post("/auth/register", userInfo);
    return response.data;
};

export const logout = async () => {
    const response = await api.post("/auth/logout");
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get("/auth/current-user");
    return response.data;
};

export const refreshToken = async () => {
    const response = await api.post("/auth/refresh-token");
    return response.data;
};

// Alias for compatibility
export const refreshAccessToken = refreshToken;

export const changePassword = async (passwordData) => {
    const response = await api.post("/auth/change-password", passwordData);
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
};

export const resetPassword = async (token, passwordData) => {
    const response = await api.post(`/auth/reset-password/${token}`, passwordData);
    return response.data;
};

export const verifyEmail = async (verificationToken) => {
    const response = await api.get(`/auth/verify-email/${verificationToken}`);
    return response.data;
};

export const resendEmailVerification = async () => {
    const response = await api.post("/auth/resend-email-verification");
    return response.data;
};
