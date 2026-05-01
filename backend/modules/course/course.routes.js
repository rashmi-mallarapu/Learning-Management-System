import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin, isInstructorOrAdmin } from '../../middleware/role.middleware.js';
import {
	createCourseController,
	getAllCoursesController,
	getInstructorCoursesController,
	getSingleCourseController,
	getCourseDetailController,
	updateCourseController,
	deleteCourseController,
	createCourseClassroomController,
	submitCourseRatingController,
} from './course.controller.js';

import { uploadThumbnail } from '../../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', authenticate, isInstructorOrAdmin, uploadThumbnail.single('thumbnail'), createCourseController);
router.get('/', getAllCoursesController);
router.get('/admin/all', authenticate, isAdmin, getAllCoursesController);
router.get('/instructor/me', authenticate, isInstructorOrAdmin, getInstructorCoursesController);
router.post('/:courseId/classroom', authenticate, isInstructorOrAdmin, createCourseClassroomController);
router.patch('/:courseId/rating', authenticate, submitCourseRatingController);
router.get('/:courseId', getSingleCourseController);
router.get('/:courseId/details', getCourseDetailController);
router.put('/:courseId', authenticate, isInstructorOrAdmin, updateCourseController);
router.delete('/:courseId', authenticate, isInstructorOrAdmin, deleteCourseController);

export default router;
