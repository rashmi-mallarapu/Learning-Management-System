import { successResponse } from '../../utils/responseHandler.js';

import { createReport, getReportById, listReports, updateReportStatus } from './report.service.js';

export const createReportController = async (req, res, next) => {
	try {
		const report = await createReport({
			title: req.body.title,
			description: req.body.description,
			category: req.body.category,
			priority: req.body.priority,
			reportedBy: req.user._id,
			reportedByRole: req.user.role,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Issue report created successfully',
			data: report,
		});
	} catch (error) {
		return next(error);
	}
};

export const listReportsController = async (req, res, next) => {
	try {
		const reports = await listReports({
			userId: req.user._id,
			role: req.user.role,
			filters: {
				status: req.query.status,
				category: req.query.category,
				search: req.query.search,
			},
		});

		return successResponse(res, {
			message: 'Issue reports fetched successfully',
			data: reports,
		});
	} catch (error) {
		return next(error);
	}
};

export const getReportController = async (req, res, next) => {
	try {
		const report = await getReportById({
			reportId: req.params.reportId,
			userId: req.user._id,
			role: req.user.role,
		});

		return successResponse(res, {
			message: 'Issue report fetched successfully',
			data: report,
		});
	} catch (error) {
		return next(error);
	}
};

export const updateReportStatusController = async (req, res, next) => {
	try {
		const report = await updateReportStatus({
			reportId: req.params.reportId,
			status: req.body.status,
			adminNote: req.body.adminNote,
		});

		return successResponse(res, {
			message: 'Issue report updated successfully',
			data: report,
		});
	} catch (error) {
		return next(error);
	}
};
