import { successResponse } from '../../utils/responseHandler.js';
import { createAppError } from '../../utils/constants.js';

import { createLesson, getLessonsByCourse, getLessonById } from './lesson.service.js';

export const createLessonController = async (req, res, next) => {
	try {
		if (!req.file) {
			throw createAppError('Lesson content file is required', 400);
		}

		const lesson = await createLesson({
			courseId: req.body.courseId,
			title: req.body.title,
			fileUrl: `/${req.file.path.replace(/\\/g, '/')}`,
			mimeType: req.file.mimetype,
			duration: req.body.duration,
			order: req.body.order,
			description: req.body.description,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Lesson created successfully',
			data: lesson,
		});
	} catch (error) {
		return next(error);
	}
};

export const listLessonsByCourseController = async (req, res, next) => {
	try {
		const lessons = await getLessonsByCourse(req.params.courseId);
		return successResponse(res, {
			message: 'Lessons fetched successfully',
			data: lessons,
		});
	} catch (error) {
		return next(error);
	}
};

export const getLessonController = async (req, res, next) => {
	try {
		const lesson = await getLessonById(req.params.lessonId);
		return successResponse(res, {
			message: 'Lesson fetched successfully',
			data: lesson,
		});
	} catch (error) {
		return next(error);
	}
};
