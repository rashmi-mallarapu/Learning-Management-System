import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isInstructorOrAdmin } from '../../middleware/role.middleware.js';
import { uploadCourseContent } from '../../middleware/upload.middleware.js';
import { createLessonController, listLessonsByCourseController, getLessonController } from './lesson.controller.js';

const router = express.Router();

router.post('/', authenticate, isInstructorOrAdmin, uploadCourseContent.single('content'), createLessonController);
router.get('/course/:courseId', authenticate, listLessonsByCourseController);
router.get('/:lessonId', authenticate, getLessonController);

export default router;
