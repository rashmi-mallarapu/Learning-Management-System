import Report from './report.model.js';

import { createAppError } from '../../utils/constants.js';

const VALID_CATEGORIES = ['Technical', 'Content', 'Account', 'Billing', 'Security', 'Other'];
const VALID_STATUSES = ['open', 'in_review', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'normal', 'high'];

export const createReport = async ({ title, description, category, priority, reportedBy, reportedByRole }) => {
	if (!title?.trim()) {
		throw createAppError('Report title is required', 400);
	}

	if (!description?.trim()) {
		throw createAppError('Report description is required', 400);
	}

	if (category && !VALID_CATEGORIES.includes(category)) {
		throw createAppError('Invalid report category', 400);
	}

	if (priority && !VALID_PRIORITIES.includes(priority)) {
		throw createAppError('Invalid report priority', 400);
	}

	return Report.create({
		title: title.trim(),
		description: description.trim(),
		category: category || 'Technical',
		priority: priority || 'normal',
		reportedBy,
		reportedByRole,
	});
};

export const listReports = async ({ userId, role, filters = {} }) => {
	const query = {};

	if (role !== 'admin') {
		query.reportedBy = userId;
	}

	if (filters.status && VALID_STATUSES.includes(filters.status)) {
		query.status = filters.status;
	}

	if (filters.category && VALID_CATEGORIES.includes(filters.category)) {
		query.category = filters.category;
	}

	if (filters.search?.trim()) {
		query.$or = [
			{ title: { $regex: filters.search.trim(), $options: 'i' } },
			{ description: { $regex: filters.search.trim(), $options: 'i' } },
			{ reportedByRole: { $regex: filters.search.trim(), $options: 'i' } },
		];
	}

	return Report.find(query)
		.populate('reportedBy', 'name email role')
		.sort({ createdAt: -1 });
};

export const getReportById = async ({ reportId, userId, role }) => {
	const report = await Report.findById(reportId).populate('reportedBy', 'name email role');

	if (!report) {
		throw createAppError('Report not found', 404);
	}

	if (role !== 'admin' && String(report.reportedBy?._id) !== String(userId)) {
		throw createAppError('Forbidden: insufficient permissions', 403);
	}

	return report;
};

export const updateReportStatus = async ({ reportId, status, adminNote }) => {
	if (!VALID_STATUSES.includes(status)) {
		throw createAppError('Invalid report status', 400);
	}

	const report = await Report.findById(reportId);

	if (!report) {
		throw createAppError('Report not found', 404);
	}

	report.status = status;

	if (typeof adminNote === 'string') {
		report.adminNote = adminNote.trim();
	}

	await report.save();

	return Report.findById(reportId).populate('reportedBy', 'name email role');
};
