import { successResponse } from '../../utils/responseHandler.js';

import {
	createCourse,
	getCourses,
	getCoursesByInstructor,
	getCourseById,
	getCourseWithDetails,
	updateCourse,
	deleteCourse,
	getAllCoursesUnfiltered,
	createClassroomForInstructorCourse,
	submitCourseRating,
} from './course.service.js';

export const createCourseController = async (req, res, next) => {
	try {
		const courseData = { ...req.body, instructorId: req.user._id };
		if (req.file) {
			courseData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
		}
		const course = await createCourse(courseData, req.user);
		return successResponse(res, {
			statusCode: 201,
			message: 'Course created successfully',
			data: course,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAllCoursesController = async (req, res, next) => {
	try {
		const { category, difficulty, search, instructorId } = req.query;
		const isAdminScope =
			(req.query.scope === 'all' || req.path.includes('/admin/all')) && req.user?.role === 'admin';
		const courses = isAdminScope
			? await getAllCoursesUnfiltered()
			: await getCourses({ category, difficulty, search, instructorId });
		return successResponse(res, {
			message: 'Courses fetched successfully',
			data: courses,
		});
	} catch (error) {
		return next(error);
	}
};

export const getInstructorCoursesController = async (req, res, next) => {
	try {
		const courses = await getCoursesByInstructor(req.user._id);
		return successResponse(res, {
			message: 'Instructor courses fetched successfully',
			data: courses,
		});
	} catch (error) {
		return next(error);
	}
};

export const getSingleCourseController = async (req, res, next) => {
	try {
		const course = await getCourseById(req.params.courseId);
		return successResponse(res, {
			message: 'Course fetched successfully',
			data: course,
		});
	} catch (error) {
		return next(error);
	}
};

export const getCourseDetailController = async (req, res, next) => {
	try {
		const course = await getCourseWithDetails(req.params.courseId);
		return successResponse(res, {
			message: 'Course details fetched successfully',
			data: course,
		});
	} catch (error) {
		return next(error);
	}
};

export const updateCourseController = async (req, res, next) => {
	try {
		const course = await updateCourse(req.params.courseId, req.body, req.user);
		return successResponse(res, {
			message: 'Course updated successfully',
			data: course,
		});
	} catch (error) {
		return next(error);
	}
};

export const deleteCourseController = async (req, res, next) => {
	try {
		await deleteCourse(req.params.courseId);
		return successResponse(res, {
			message: 'Course deleted successfully',
		});
	} catch (error) {
		return next(error);
	}
};

export const createCourseClassroomController = async (req, res, next) => {
	try {
		const result = await createClassroomForInstructorCourse({
			courseId: req.params.courseId,
			instructorId: req.user._id,
		});

		return successResponse(res, {
			message: result.alreadyExists
				? 'Google Classroom already exists for this course'
				: 'Google Classroom created and learners notified successfully',
			data: {
				courseId: result.course._id,
				courseTitle: result.course.title,
				classroom: result.classroom,
				alreadyExists: result.alreadyExists,
				notifiedStudents: result.notifiedStudents,
			},
		});
	} catch (error) {
		return next(error);
	}
};

export const submitCourseRatingController = async (req, res, next) => {
	try {
		const course = await submitCourseRating({
			courseId: req.params.courseId,
			userId: req.user._id,
			rating: req.body.rating,
		});

		return successResponse(res, {
			message: 'Course rating submitted successfully',
			data: course,
		});
	} catch (error) {
		return next(error);
	}
};
