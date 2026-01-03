import api from "./axios.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const getNotifications = async (limit = 20) => {
    const response = await api.get("/notifications", { params: { limit } });
    return unwrap(response);
};

export const markNotificationAsRead = async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return unwrap(response);
};

export const markAllNotificationsAsRead = async () => {
    const response = await api.patch("/notifications/mark-all-read");
    return unwrap(response);
};

export const deleteNotification = async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return unwrap(response);
};
