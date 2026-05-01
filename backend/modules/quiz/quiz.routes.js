import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isInstructorOrAdmin, isLearnerOrAdmin } from '../../middleware/role.middleware.js';
import {
	createQuizController,
	listQuizzesByCourseController,
	getQuizController,
	getQuizByLessonController,
	submitQuizController,
	myQuizzesController,
	getAttemptResultController,
	instructorQuizAttemptsController,
	myQuizAttemptsController,
	reviewQuizAttemptController,
} from './quiz.controller.js';

const router = express.Router();

router.post('/', authenticate, isInstructorOrAdmin, createQuizController);
router.get('/me', authenticate, myQuizzesController);
router.get('/instructor/attempts', authenticate, isInstructorOrAdmin, instructorQuizAttemptsController);
router.get('/course/:courseId', authenticate, listQuizzesByCourseController);
router.get('/lesson/:courseId/:lessonOrder', authenticate, getQuizByLessonController);
router.get('/attempt/:attemptId', authenticate, getAttemptResultController);
router.patch('/attempt/:attemptId/review', authenticate, isInstructorOrAdmin, reviewQuizAttemptController);
router.get('/:quizId', authenticate, getQuizController);
router.post('/:quizId/submit', authenticate, isLearnerOrAdmin, submitQuizController);
router.get('/:quizId/my-attempts', authenticate, myQuizAttemptsController);

export default router;
