import { successResponse } from '../../utils/responseHandler.js';

import {
	approveAccessRequest,
	getInstructorAccessRequests,
	getMessageAccessStatus,
	hasApprovedAccess,
	rejectAccessRequest,
	requestMessageAccess,
} from './messageAccess.service.js';

export const requestMessageAccessController = async (req, res, next) => {
	try {
		const request = await requestMessageAccess({
			learnerId: req.user._id,
			instructorId: req.body.instructorId,
			note: req.body.note,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Access request sent successfully',
			data: request,
		});
	} catch (error) {
		return next(error);
	}
};

export const getMessageAccessStatusController = async (req, res, next) => {
	try {
		const status = await getMessageAccessStatus({
			learnerId: req.user._id,
			instructorId: req.params.instructorId,
		});

		return successResponse(res, {
			message: 'Access status fetched successfully',
			data: status,
		});
	} catch (error) {
		return next(error);
	}
};

export const getInstructorAccessRequestsController = async (req, res, next) => {
	try {
		const requests = await getInstructorAccessRequests(req.user._id);
		return successResponse(res, {
			message: 'Access requests fetched successfully',
			data: requests,
		});
	} catch (error) {
		return next(error);
	}
};

export const approveAccessRequestController = async (req, res, next) => {
	try {
		const request = await approveAccessRequest({
			requestId: req.params.requestId,
			instructorId: req.user._id,
		});

		return successResponse(res, {
			message: 'Access request approved successfully',
			data: request,
		});
	} catch (error) {
		return next(error);
	}
};

export const rejectAccessRequestController = async (req, res, next) => {
	try {
		const request = await rejectAccessRequest({
			requestId: req.params.requestId,
			instructorId: req.user._id,
		});

		return successResponse(res, {
			message: 'Access request rejected successfully',
			data: request,
		});
	} catch (error) {
		return next(error);
	}
};

export const checkApprovedAccessController = async (req, res, next) => {
	try {
		const approved = await hasApprovedAccess({
			learnerId: req.user._id,
			instructorId: req.params.instructorId,
		});

		return successResponse(res, {
			message: 'Access check completed',
			data: { approved },
		});
	} catch (error) {
		return next(error);
	}
};