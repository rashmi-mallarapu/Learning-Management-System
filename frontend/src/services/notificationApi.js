import { api } from './api';

const unwrap = (response) => response.data?.data;

export const fetchMyNotifications = () => api.get('/notifications/me').then(unwrap);
export const markNotificationRead = (notificationId) => api.patch(`/notifications/${notificationId}/read`).then(unwrap);
export const markAllNotificationsRead = () => api.patch('/notifications/me/read-all').then(unwrap);
