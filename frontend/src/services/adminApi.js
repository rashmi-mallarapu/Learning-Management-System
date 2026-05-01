import { api } from './api';

const unwrap = (response) => response.data?.data;

// ── Audit Logs ──
export const fetchAuditLogs = (params = {}) =>
    api.get('/audit-logs', { params }).then((res) => res.data);

export const fetchAuditLogStats = () =>
    api.get('/audit-logs/stats').then(unwrap);

export const clearAuditLogs = () =>
    api.delete('/audit-logs').then(unwrap);

// ── Admin User Management ──
export const fetchAdminUsers = (params = {}) =>
    api.get('/users', { params }).then(unwrap);

export const updateUserRole = (userId, role) =>
    api.patch(`/users/${userId}/role`, { role }).then(unwrap);

// ── Admin Course Moderation ──
export const fetchAdminCourses = () =>
    api.get('/courses/admin/all').then(unwrap);

export const updateCourseStatus = (courseId, payload) =>
    api.put(`/courses/${courseId}`, payload).then(unwrap);

// ── Admin Issue Reports ──
export const fetchAllIssueReports = (params = {}) =>
    api.get('/reports', { params }).then(unwrap);

export const updateIssueReportStatus = (reportId, payload) =>
    api.patch(`/reports/${reportId}/status`, payload).then(unwrap);
