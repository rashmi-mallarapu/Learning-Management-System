import Assignment from '../assignment/assignment.model.js';
import Submission from './submission.model.js';
import Course from '../course/course.model.js';
import { recalculateProgressForCourse } from '../progress/progress.service.js';

import { createAppError } from '../../utils/constants.js';
import { logEvent } from '../auditLog/auditLog.service.js';

export const createSubmission = async ({ assignmentId, userId, fileUrl }) => {
	const assignment = await Assignment.findById(assignmentId);
	if (!assignment) {
		throw createAppError('Assignment not found', 404);
	}

	const existingSubmission = await Submission.findOne({ assignmentId, userId });
	if (existingSubmission) {
		throw createAppError('Submission already exists for this assignment', 409);
	}

	const submission = await Submission.create({
		assignmentId,
		userId,
		fileUrl,
	});

	await recalculateProgressForCourse({ userId, courseId: assignment.courseId });

	await logEvent({
		type: 'mod',
		event: `Assignment submitted: "${assignment.title}"`,
		userId,
		severity: 'low',
		meta: { assignmentId, submissionId: submission._id },
	});

	return submission;
};

export const assignGrade = async ({ submissionId, grade, feedback, gradedBy }) => {
	const submission = await Submission.findByIdAndUpdate(
		submissionId,
		{
			grade,
			feedback: feedback || '',
			gradedBy: gradedBy || null,
			gradedAt: new Date(),
		},
		{ new: true, runValidators: true }
	).populate('userId', 'name email').populate({
		path: 'assignmentId',
		select: 'title courseId deadline points',
		populate: {
			path: 'courseId',
			select: 'title',
		},
	});

	if (!submission) {
		throw createAppError('Submission not found', 404);
	}

	await logEvent({
		type: 'mod',
		event: `Assignment graded: "${submission.assignmentId?.title}" — ${grade}/${submission.assignmentId?.points || 100}`,
		userId: gradedBy,
		severity: 'low',
		meta: { submissionId, grade },
	});

	return submission;
};

export const getInstructorSubmissions = async ({ instructorId, status = 'all' }) => {
	const ownedCourses = await Course.find({ instructorId }).select('_id').lean();
	const courseIds = ownedCourses.map((course) => course._id);

	if (courseIds.length === 0) {
		return [];
	}

	const assignments = await Assignment.find({ courseId: { $in: courseIds } }).select('_id').lean();
	const assignmentIds = assignments.map((assignment) => assignment._id);

	if (assignmentIds.length === 0) {
		return [];
	}

	const filter = { assignmentId: { $in: assignmentIds } };
	if (status === 'pending') {
		filter.grade = null;
	}
	if (status === 'graded') {
		filter.grade = { $ne: null };
	}

	return Submission.find(filter)
		.populate('userId', 'name email')
		.populate('gradedBy', 'name email')
		.populate({
			path: 'assignmentId',
			select: 'title courseId deadline points',
			populate: {
				path: 'courseId',
				select: 'title',
			},
		})
		.sort({ createdAt: -1 });
};

export const getSubmissionsByAssignment = async (assignmentId) =>
	Submission.find({ assignmentId }).populate('userId', 'name email').sort({ _id: -1 });

export const getSubmissionsByUser = async (userId) =>
	Submission.find({ userId })
		.populate('assignmentId', 'title courseId deadline points')
		.sort({ _id: -1 });

export const getSubmissionByUserAndAssignment = async (userId, assignmentId) =>
	Submission.findOne({ userId, assignmentId });

export const getSubmissionById = async (submissionId) => {
	const submission = await Submission.findById(submissionId)
		.populate('userId', 'name email')
		.populate({
			path: 'assignmentId',
			select: 'title description deadline points courseId',
			populate: {
				path: 'courseId',
				select: 'title',
			},
		});

	if (!submission) {
		throw createAppError('Submission not found', 404);
	}

	return submission;
};
