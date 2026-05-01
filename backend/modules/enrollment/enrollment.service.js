import Course from '../course/course.model.js';
import Enrollment from './enrollment.model.js';
import Progress from '../progress/progress.model.js';
import { createNotification } from '../notification/notification.service.js';

import { createAppError } from '../../utils/constants.js';
import { logEvent } from '../auditLog/auditLog.service.js';

export const enrollInCourse = async ({ userId, courseId }) => {
	const course = await Course.findById(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	const existingEnrollment = await Enrollment.findOne({ userId, courseId });
	if (existingEnrollment) {
		throw createAppError('User is already enrolled in this course', 409);
	}

	const enrollment = await Enrollment.create({ userId, courseId });

	// Initialize progress record
	await Progress.findOneAndUpdate(
		{ userId, courseId },
		{ completionPercentage: 0 },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	);

	// Increment enrolled count on course
	await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

	if (course.googleClassroom?.id) {
		await createNotification({
			recipientId: userId,
			title: `Join ${course.title} on Google Classroom`,
			message: course.googleClassroom.alternateLink
				? `Your instructor already created the Google Classroom for this course. Open the join link and use code ${course.googleClassroom.enrollmentCode || 'shown on the classroom page'}.`
				: `Your instructor already created the Google Classroom for this course. Use code ${course.googleClassroom.enrollmentCode || 'shared by your instructor'} to join.`,
			type: 'classroom',
			link: course.googleClassroom.alternateLink || '',
			data: {
				courseId: String(course._id),
				courseTitle: course.title,
				classroomId: course.googleClassroom.id,
				classroomLink: course.googleClassroom.alternateLink || '',
				enrollmentCode: course.googleClassroom.enrollmentCode || '',
			},
		});
	}

	await logEvent({
		type: 'mod',
		event: `User enrolled in course "${course.title}"`,
		userId,
		severity: 'low',
	});

	return enrollment;
};

export const getEnrollmentsByUser = async (userId) =>
	Enrollment.find({ userId })
		.populate({
			path: 'courseId',
			select: 'title description instructorId category difficulty thumbnail tags status enrolledCount rating createdAt',
			populate: { path: 'instructorId', select: 'name email' },
		})
		.sort({ enrolledAt: -1 });

export const checkEnrollment = async ({ userId, courseId }) => {
	const enrollment = await Enrollment.findOne({ userId, courseId });
	return !!enrollment;
};

export const unenrollFromCourse = async ({ userId, courseId }) => {
	const enrollment = await Enrollment.findOneAndDelete({ userId, courseId });
	if (!enrollment) {
		throw createAppError('Enrollment not found', 404);
	}
	await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });

	const course = await Course.findById(courseId).select('title');
	await logEvent({
		type: 'mod',
		event: `User unenrolled from course "${course?.title || courseId}"`,
		userId,
		severity: 'low',
	});

	return enrollment;
};
