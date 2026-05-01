import MessageAccessRequest from './messageAccess.model.js';
import User from '../user/user.model.js';

import { ROLES, createAppError } from '../../utils/constants.js';

const populateAccessRequest = async (request) => {
	if (!request) return request;
	await request.populate([
		{ path: 'learnerId', select: 'name email role' },
		{ path: 'instructorId', select: 'name email role' },
		{ path: 'reviewedBy', select: 'name email role' },
	]);
	return request;
};

export const requestMessageAccess = async ({ learnerId, instructorId, note = '' }) => {
	const learner = await User.findById(learnerId);
	const instructor = await User.findById(instructorId);

	if (!learner) {
		throw createAppError('Learner not found', 404);
	}
	if (!instructor || instructor.role !== ROLES.INSTRUCTOR) {
		throw createAppError('Instructor not found', 404);
	}

	const existing = await MessageAccessRequest.findOne({ learnerId, instructorId });

	if (existing) {
		if (existing.status === 'approved') {
			return populateAccessRequest(existing);
		}

		existing.status = 'pending';
		existing.note = note;
		existing.reviewedBy = null;
		existing.reviewedAt = null;
		await existing.save();
		return populateAccessRequest(existing);
	}

	const created = await MessageAccessRequest.create({ learnerId, instructorId, note });
	return populateAccessRequest(created);
};

export const getMessageAccessStatus = async ({ learnerId, instructorId }) => {
	const request = await MessageAccessRequest.findOne({ learnerId, instructorId })
		.populate('learnerId', 'name email role')
		.populate('instructorId', 'name email role')
		.populate('reviewedBy', 'name email role');

	if (!request) {
		return { status: 'none' };
	}

	return request;
};

export const getInstructorAccessRequests = async (instructorId) =>
	MessageAccessRequest.find({ instructorId })
		.populate('learnerId', 'name email role')
		.populate('instructorId', 'name email role')
		.populate('reviewedBy', 'name email role')
		.sort({ createdAt: -1 });

export const approveAccessRequest = async ({ requestId, instructorId }) => {
	const request = await MessageAccessRequest.findById(requestId);
	if (!request) {
		throw createAppError('Access request not found', 404);
	}
	if (request.instructorId.toString() !== instructorId.toString()) {
		throw createAppError('Forbidden: request does not belong to this instructor', 403);
	}

	request.status = 'approved';
	request.reviewedBy = instructorId;
	request.reviewedAt = new Date();
	await request.save();
	return populateAccessRequest(request);
};

export const rejectAccessRequest = async ({ requestId, instructorId }) => {
	const request = await MessageAccessRequest.findById(requestId);
	if (!request) {
		throw createAppError('Access request not found', 404);
	}
	if (request.instructorId.toString() !== instructorId.toString()) {
		throw createAppError('Forbidden: request does not belong to this instructor', 403);
	}

	request.status = 'rejected';
	request.reviewedBy = instructorId;
	request.reviewedAt = new Date();
	await request.save();
	return populateAccessRequest(request);
};

export const hasApprovedAccess = async ({ learnerId, instructorId }) => {
	const request = await MessageAccessRequest.findOne({
		learnerId,
		instructorId,
		status: 'approved',
	});

	return Boolean(request);
};