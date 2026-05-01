import { successResponse, paginatedResponse } from '../../utils/responseHandler.js';
import { getAuditLogs, clearAllAuditLogs, getAuditLogStats, logEvent } from './auditLog.service.js';

export const listAuditLogsController = async (req, res, next) => {
	try {
		const { type, severity, search, page, limit } = req.query;
		const result = await getAuditLogs({
			type,
			severity,
			search,
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 50,
		});

		return paginatedResponse(res, {
			message: 'Audit logs fetched successfully',
			data: result.logs,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			},
		});
	} catch (error) {
		return next(error);
	}
};

export const getAuditLogStatsController = async (req, res, next) => {
	try {
		const stats = await getAuditLogStats();
		return successResponse(res, {
			message: 'Audit log stats fetched successfully',
			data: stats,
		});
	} catch (error) {
		return next(error);
	}
};

export const clearAuditLogsController = async (req, res, next) => {
	try {
		const deleted = await clearAllAuditLogs();

		// Log the clear action itself
		await logEvent({
			type: 'system',
			event: 'Admin cleared all audit logs',
			user: req.user?.name || 'admin',
			userId: req.user?._id || null,
			ip: req.ip || 'internal',
			severity: 'high',
		});

		return successResponse(res, {
			message: `${deleted} audit log entries cleared`,
			data: { deleted },
		});
	} catch (error) {
		return next(error);
	}
};

export const logCallEndController = async (req, res, next) => {
	try {
		const { channelName, calleeName, calleeId, durationSeconds, callType = 'video' } = req.body;
		const callerName = req.user?.name || 'Unknown';

		const durationLabel = durationSeconds != null && durationSeconds > 0
			? ` — Duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
			: ' — Duration: < 1s';

		const calleeLabel = calleeName ? `"${calleeName}"` : `channel "${channelName}"`;

		await logEvent({
			type: 'system',
			event: `${callType === 'video' ? 'Video' : 'Audio'} call ended: "${callerName}" called ${calleeLabel}${durationLabel}`,
			user: callerName,
			userId: req.user?._id || null,
			ip: req.ip || 'unknown',
			severity: 'low',
			meta: { channelName, callerName, calleeName, calleeId, durationSeconds, callType },
		});

		return successResponse(res, { message: 'Call end logged' });
	} catch (error) {
		return next(error);
	}
};
