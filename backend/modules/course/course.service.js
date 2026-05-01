import Course from './course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Progress from '../progress/progress.model.js';
import { findLessonsByCourseId } from '../lesson/lesson.service.js';
import { createNotificationsForUsers } from '../notification/notification.service.js';
import { createGoogleClassroomCourse } from './googleClassroom.service.js';

import { createAppError } from '../../utils/constants.js';
import { logEvent } from '../auditLog/auditLog.service.js';

export const createCourse = async ({ title, description, instructorId, category, difficulty, duration, thumbnail, tags, status }, actor) => {
	const course = await Course.create({
		title,
		description,
		instructorId,
		category,
		difficulty,
		duration,
		thumbnail,
		tags,
		status: actor?.role === 'admin' && ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
	});

	await logEvent({
		type: 'mod',
		event: `Course created: "${title}"`,
		userId: instructorId,
		severity: 'low',
		meta: { courseId: course._id, category, status: course.status },
	});

	return course;
};

export const getCourses = async (query = {}) => {
	const filter = { status: 'published' };

	if (query.category && query.category !== 'All') {
		filter.category = query.category;
	}
	if (query.difficulty && query.difficulty !== 'All') {
		filter.difficulty = query.difficulty;
	}
	if (query.search) {
		filter.$or = [
			{ title: { $regex: query.search, $options: 'i' } },
			{ description: { $regex: query.search, $options: 'i' } },
			{ tags: { $regex: query.search, $options: 'i' } },
		];
	}
	if (query.instructorId) {
		filter.instructorId = query.instructorId;
	}

	return Course.find(filter)
		.populate('instructorId', 'name email role')
		.sort({ createdAt: -1 });
};

export const getCoursesByInstructor = async (instructorId) =>
	Course.find({ instructorId })
		.populate('instructorId', 'name email role')
		.sort({ createdAt: -1 });

export const getAllCoursesUnfiltered = async () =>
	Course.find()
		.populate('instructorId', 'name email role')
		.sort({ createdAt: -1 });

export const getCourseById = async (courseId) => {
	const course = await Course.findById(courseId).populate('instructorId', 'name email role');

	if (!course) {
		throw createAppError('Course not found', 404);
	}

	if (course.status !== 'published') {
		throw createAppError('Course is awaiting admin approval', 403);
	}

	return course;
};

export const getCourseWithDetails = async (courseId) => {
	const course = await Course.findById(courseId).populate('instructorId', 'name email role');

	if (!course) {
		throw createAppError('Course not found', 404);
	}

	if (course.status !== 'published') {
		throw createAppError('Course is awaiting admin approval', 403);
	}

	const lessons = await findLessonsByCourseId(courseId);
	const enrollmentCount = await Enrollment.countDocuments({ courseId });

	return {
		...course.toObject(),
		lessons,
		enrolledCount: enrollmentCount,
	};
};

export const updateCourse = async (courseId, updateData, actor) => {
	const course = await Course.findById(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	if (actor?.role !== 'admin' && String(course.instructorId) !== String(actor?._id)) {
		throw createAppError('Forbidden: insufficient permissions', 403);
	}

	const nextData = { ...updateData };

	if (actor?.role !== 'admin') {
		delete nextData.status;
	}

	Object.assign(course, nextData);
	await course.save();

	// Log status changes (publish, archive, draft)
	if (updateData.status && updateData.status !== course.status) {
		await logEvent({
			type: 'mod',
			event: `Course "${course.title}" status changed to ${updateData.status}`,
			userId: actor?._id,
			severity: updateData.status === 'published' ? 'low' : 'medium',
			meta: { courseId, newStatus: updateData.status },
		});
	}

	return Course.findById(courseId).populate('instructorId', 'name email role');
};

export const deleteCourse = async (courseId) => {
	const course = await Course.findByIdAndDelete(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	await logEvent({
		type: 'mod',
		event: `Course deleted: "${course.title}"`,
		severity: 'high',
		meta: { courseId },
	});

	return course;
};

export const createClassroomForInstructorCourse = async ({ courseId, instructorId }) => {
	const course = await Course.findOne({ _id: courseId, instructorId }).populate('instructorId', 'name email');
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	if (course.googleClassroom?.id) {
		return {
			course,
			classroom: course.googleClassroom,
			alreadyExists: true,
			notifiedStudents: 0,
		};
	}

	const classroom = await createGoogleClassroomCourse({
		title: course.title,
		description: course.description,
		section: course.category || 'LMS Course',
	});

	course.googleClassroom = classroom;
	await course.save();

	const enrollments = await Enrollment.find({ courseId: course._id }).populate('userId', 'name email');
	const learnerIds = enrollments
		.map((enrollment) => enrollment.userId?._id || enrollment.userId)
		.filter(Boolean);

	await createNotificationsForUsers(learnerIds, {
		title: `Join ${course.title} on Google Classroom`,
		message: classroom.alternateLink
			? `Your instructor created a live Google Classroom. Open the join link and use code ${classroom.enrollmentCode || 'shared in the classroom page'}.`
			: `Your instructor created a live Google Classroom for ${course.title}. Use code ${classroom.enrollmentCode || 'shared by your instructor'} to join.`,
		type: 'classroom',
		link: classroom.alternateLink || '',
		data: {
			courseId: String(course._id),
			courseTitle: course.title,
			classroomId: classroom.id,
			classroomLink: classroom.alternateLink || '',
			enrollmentCode: classroom.enrollmentCode || '',
		},
	});

	return {
		course,
		classroom,
		alreadyExists: false,
		notifiedStudents: learnerIds.length,
	};
};

export const submitCourseRating = async ({ courseId, userId, rating }) => {
	const course = await Course.findById(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	const enrollment = await Enrollment.findOne({ courseId, userId });
	if (!enrollment) {
		throw createAppError('You must enroll before rating this course', 403);
	}

	const progress = await Progress.findOne({ courseId, userId });
	if (!progress || Number(progress.completionPercentage || 0) < 100) {
		throw createAppError('Complete this course before submitting a rating', 403);
	}

	const numericRating = Number(rating);
	if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
		throw createAppError('Rating must be between 1 and 5', 400);
	}

	const existingRating = course.ratings.find((entry) => String(entry.userId) === String(userId));
	if (existingRating) {
		existingRating.value = numericRating;
		existingRating.ratedAt = new Date();
	} else {
		course.ratings.push({
			userId,
			value: numericRating,
			ratedAt: new Date(),
		});
	}

	const ratingTotal = course.ratings.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
	course.reviewCount = course.ratings.length;
	course.rating = course.reviewCount > 0 ? Number((ratingTotal / course.reviewCount).toFixed(1)) : 0;
	await course.save();

	await logEvent({
		type: 'mod',
		event: `Course rated: "${course.title}" - ${numericRating}/5`,
		userId,
		severity: 'low',
		meta: { courseId, rating: numericRating },
	});

	return Course.findById(courseId).populate('instructorId', 'name email role');
};
