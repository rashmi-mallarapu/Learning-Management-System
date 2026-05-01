import AuditLog from './auditLog.model.js';

const VALID_TYPES = ['auth', 'system', 'mod', 'security', 'content'];
const VALID_SEVERITIES = ['low', 'medium', 'high'];

/**
 * Write a single audit event to the database.
 * This is a fire-and-forget helper — errors are silently swallowed
 * so they never interrupt the calling request.
 *
 * @param {Object} opts
 * @param {'auth'|'system'|'mod'|'security'} opts.type
 * @param {string} opts.event  Human-readable description
 * @param {string} [opts.user]  Username / display name
 * @param {string} [opts.userId]  MongoDB ObjectId of the user (if known)
 * @param {string} [opts.ip]  Source IP address
 * @param {'low'|'medium'|'high'} [opts.severity]
 * @param {Object} [opts.meta]  Any extra payload
 */
export const logEvent = async ({ type, event, user = 'SYSTEM', userId = null, ip = 'internal', severity = 'low', meta = {} } = {}) => {
	try {
		await AuditLog.create({ type, event, user, userId, ip, severity, meta });
	} catch {
		// Audit logging must never crash the main request
	}
};

/**
 * Fetch audit logs for the admin panel.
 * Supports filtering by type, severity, and a free-text search.
 */
export const getAuditLogs = async ({ type, severity, search, page = 1, limit = 50 } = {}) => {
	const query = {};

	if (type && VALID_TYPES.includes(type)) {
		query.type = type;
	}

	if (severity && VALID_SEVERITIES.includes(severity)) {
		query.severity = severity;
	}

	if (search?.trim()) {
		query.$or = [
			{ event: { $regex: search.trim(), $options: 'i' } },
			{ user: { $regex: search.trim(), $options: 'i' } },
			{ ip: { $regex: search.trim(), $options: 'i' } },
		];
	}

	const skip = (page - 1) * limit;
	const total = await AuditLog.countDocuments(query);
	const logs = await AuditLog.find(query)
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.lean();

	return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Delete all audit log entries from the database.
 */
export const clearAllAuditLogs = async () => {
	const result = await AuditLog.deleteMany({});
	return result.deletedCount;
};

/**
 * Aggregate summary counts for the stats cards on the admin logs page.
 */
export const getAuditLogStats = async () => {
	const [total, security, failedLogins, system] = await Promise.all([
		AuditLog.countDocuments({}),
		AuditLog.countDocuments({ type: 'security' }),
		AuditLog.countDocuments({ event: { $regex: 'failed login', $options: 'i' } }),
		AuditLog.countDocuments({ type: 'system' }),
	]);

	return { total, security, failedLogins, system };
};
