import { successResponse } from '../../utils/responseHandler.js';
import { createAppError } from '../../utils/constants.js';
import Submission from './submission.model.js';
import { getIORef } from '../../config/socket.js';

import {
	assignGrade,
	createSubmission,
	getInstructorSubmissions,
	getSubmissionsByAssignment,
	getSubmissionsByUser,
	getSubmissionById,
} from './submission.service.js';

export const submitAssignmentController = async (req, res, next) => {
	try {
		if (!req.file) {
			throw createAppError('Submission file is required', 400);
		}

		const submission = await createSubmission({
			assignmentId: req.body.assignmentId,
			userId: req.user._id,
			fileUrl: `/${req.file.path.replace(/\\/g, '/')}`,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Assignment submitted successfully',
			data: submission,
		});
	} catch (error) {
		return next(error);
	}
};

export const gradeSubmissionController = async (req, res, next) => {
	try {
		const updatedSubmission = await assignGrade({
			submissionId: req.params.submissionId,
			grade: req.body.grade,
			feedback: req.body.feedback,
			gradedBy: req.user._id,
		});

		// Get IO instance and emit to learner
		const io = getIORef();
		if (io && updatedSubmission && updatedSubmission.userId) {
			io.to(`user:${updatedSubmission.userId._id || updatedSubmission.userId}`).emit('grade:received', {
				submissionId: updatedSubmission._id,
				assignmentId: updatedSubmission.assignmentId?._id,
				assignmentTitle: updatedSubmission.assignmentId?.title,
				grade: updatedSubmission.grade,
				gradedAt: new Date().toISOString(),
			});
		}

		return successResponse(res, {
			message: 'Submission graded successfully',
			data: updatedSubmission,
		});
	} catch (error) {
		return next(error);
	}
};

export const listSubmissionsByAssignmentController = async (req, res, next) => {
	try {
		const submissions = await getSubmissionsByAssignment(req.params.assignmentId);
		return successResponse(res, {
			message: 'Submissions fetched successfully',
			data: submissions,
		});
	} catch (error) {
		return next(error);
	}
};

export const mySubmissionsController = async (req, res, next) => {
	try {
		const submissions = await getSubmissionsByUser(req.user._id);
		return successResponse(res, {
			message: 'Submissions fetched successfully',
			data: submissions,
		});
	} catch (error) {
		return next(error);
	}
};

export const getSubmissionController = async (req, res, next) => {
	try {
		const submission = await getSubmissionById(req.params.submissionId);
		return successResponse(res, {
			message: 'Submission fetched successfully',
			data: submission,
		});
	} catch (error) {
		return next(error);
	}
};

export const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await getInstructorSubmissions({
		instructorId: req.user._id,
		status: 'pending',
	});

	return successResponse(res, {
		message: 'Pending submissions fetched successfully',
		data: submissions,
	});
  } catch (error) {
	return res.status(500).json({ message: error.message });
  }
};

export const getInstructorSubmissionsController = async (req, res, next) => {
	try {
		const submissions = await getInstructorSubmissions({
			instructorId: req.user._id,
			status: req.query.status || 'all',
		});

		return successResponse(res, {
			message: 'Instructor submissions fetched successfully',
			data: submissions,
		});
	} catch (error) {
		return next(error);
	}
};
