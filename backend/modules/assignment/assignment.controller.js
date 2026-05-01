import { successResponse } from '../../utils/responseHandler.js';
import { emitToUsers } from '../../config/socket.js';

import {
	createAssignment,
	getAssignmentsByCourse,
	getAssignmentById,
	getAssignmentsForLearner,
	getEnrolledLearnerIdsByCourse,
} from './assignment.service.js';

export const createAssignmentController = async (req, res, next) => {
	try {
		const assignment = await createAssignment({
			...req.body,
			creatorId: req.user?._id,
			creatorRole: req.user?.role,
		});

		const learnerIds = await getEnrolledLearnerIdsByCourse(assignment.courseId);
		emitToUsers(learnerIds, 'assignment:posted', {
			assignmentId: String(assignment._id),
			courseId: String(assignment.courseId),
			title: assignment.title,
			deadline: assignment.deadline,
			points: assignment.points,
			createdAt: assignment.createdAt,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Assignment created successfully',
			data: assignment,
		});
	} catch (error) {
		return next(error);
	}
};

export const listAssignmentsByCourseController = async (req, res, next) => {
	try {
		const assignments = await getAssignmentsByCourse(req.params.courseId);
		return successResponse(res, {
			message: 'Assignments fetched successfully',
			data: assignments,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAssignmentController = async (req, res, next) => {
	try {
		const assignment = await getAssignmentById(req.params.assignmentId);
		return successResponse(res, {
			message: 'Assignment fetched successfully',
			data: assignment,
		});
	} catch (error) {
		return next(error);
	}
};

export const myAssignmentsController = async (req, res, next) => {
	try {
		const assignments = await getAssignmentsForLearner(req.user._id);
		return successResponse(res, {
			message: 'Assignments fetched successfully',
			data: assignments,
		});
	} catch (error) {
		return next(error);
	}
};
