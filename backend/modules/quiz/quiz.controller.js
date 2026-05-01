import { successResponse } from '../../utils/responseHandler.js';
import { getIORef } from '../../config/socket.js';
import { createNotificationsForUsers } from '../notification/notification.service.js';
import { ROLES } from '../../utils/constants.js';

import { createQuiz, getQuizzesByCourse, getQuizByLessonOrder, getQuizById, submitQuizAnswers, getQuizzesForLearner, getQuizzesForInstructor, getQuizAttemptResult, getQuizAttemptsByUser, getEnrolledLearnerIdsByCourse, getQuizAttemptsForInstructor, reviewQuizAttempt } from './quiz.service.js';

export const createQuizController = async (req, res, next) => {
	try {
		const quiz = await createQuiz({ ...req.body, createdBy: req.user._id, creatorRole: req.user.role });
		
		// Emit real-time notification to enrolled learners
		const io = getIORef();
		if (io && quiz.courseId) {
			const enrolledLearnerIds = await getEnrolledLearnerIdsByCourse(quiz.courseId);
			if (enrolledLearnerIds && enrolledLearnerIds.length > 0) {
				await createNotificationsForUsers(enrolledLearnerIds, {
					title: 'New quiz posted',
					message: `${quiz.title} is now available.`,
					type: 'quiz',
					link: '/learner/quizzes',
					data: {
						quizId: quiz._id,
						courseId: quiz.courseId,
						title: quiz.title,
						timeLimit: quiz.timeLimit,
						questionCount: quiz.questions?.length || 0,
					},
				});

				io.to(`user:${req.user._id}`).emit('quiz:created', {
					quizId: quiz._id,
					courseId: quiz.courseId,
					title: quiz.title,
					timeLimit: quiz.timeLimit,
					questionCount: quiz.questions?.length || 0,
					createdAt: quiz.createdAt,
				});
				enrolledLearnerIds.forEach((learnerId) => {
					io.to(`user:${learnerId}`).emit('quiz:posted', {
						quizId: quiz._id,
						courseId: quiz.courseId,
						title: quiz.title,
						timeLimit: quiz.timeLimit,
						questionCount: quiz.questions?.length || 0,
						createdAt: quiz.createdAt,
					});
				});
			}
		}
		
		return successResponse(res, {
			statusCode: 201,
			message: 'Quiz created successfully. Learners are notified instantly.',
			data: quiz,
		});
	} catch (error) {
		return next(error);
	}
};

export const submitQuizController = async (req, res, next) => {
	try {
		const result = await submitQuizAnswers({
			quizId: req.params.quizId,
			userId: req.user._id,
			answers: req.body.answers,
			timeTaken: req.body.timeTaken,
			requester: req.user,
		});

		// Emit real-time notification to instructor
		const io = getIORef();
		if (io && result) {
			io.to(`user:${req.user._id}`).emit('quiz:submitted', {
				attemptId: result.attemptId,
				quizId: result.quizId,
				quizTitle: result.quizTitle,
				score: result.score,
				total: result.total,
				percentage: result.percentage,
				passed: result.passed,
				passingScore: result.passingScore,
				submittedAt: new Date().toISOString(),
			});
		}

		return successResponse(res, {
			message: 'Quiz submitted successfully',
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};

export const listQuizzesByCourseController = async (req, res, next) => {
	try {
		const quizzes = await getQuizzesByCourse(req.params.courseId, req.user);
		return successResponse(res, {
			message: 'Quizzes fetched successfully',
			data: quizzes,
		});
	} catch (error) {
		return next(error);
	}
};

export const getQuizByLessonController = async (req, res, next) => {
	try {
		const { courseId, lessonOrder } = req.params;
		const quiz = await getQuizByLessonOrder(courseId, lessonOrder, req.user);
		return successResponse(res, {
			message: quiz ? 'Quiz fetched' : 'No quiz for this lesson',
			data: quiz, // null means no quiz — not an error
		});
	} catch (error) {
		return next(error);
	}
};

export const getQuizController = async (req, res, next) => {
	try {
		const quiz = await getQuizById(req.params.quizId, req.user);
		return successResponse(res, {
			message: 'Quiz fetched successfully',
			data: quiz,
		});
	} catch (error) {
		return next(error);
	}
};

export const myQuizzesController = async (req, res, next) => {
	try {
		const quizzes = req.user.role === ROLES.INSTRUCTOR
			? await getQuizzesForInstructor(req.user._id)
			: await getQuizzesForLearner(req.user._id);

		return successResponse(res, {
			message: 'Quizzes fetched successfully',
			data: quizzes,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAttemptResultController = async (req, res, next) => {
	try {
		const result = await getQuizAttemptResult(req.params.attemptId);
		return successResponse(res, {
			message: 'Quiz result fetched successfully',
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};

export const myQuizAttemptsController = async (req, res, next) => {
	try {
		const attempts = await getQuizAttemptsByUser(req.user._id, req.params.quizId);
		return successResponse(res, {
			message: 'Quiz attempts fetched successfully',
			data: attempts,
		});
	} catch (error) {
		return next(error);
	}
};

export const instructorQuizAttemptsController = async (req, res, next) => {
	try {
		const attempts = await getQuizAttemptsForInstructor({
			instructorId: req.user._id,
			status: req.query.status || 'all',
		});

		return successResponse(res, {
			message: 'Instructor quiz attempts fetched successfully',
			data: attempts,
		});
	} catch (error) {
		return next(error);
	}
};

export const reviewQuizAttemptController = async (req, res, next) => {
	try {
		const attempt = await reviewQuizAttempt({
			attemptId: req.params.attemptId,
			instructorId: req.user._id,
			percentage: req.body.grade ?? req.body.percentage,
			feedback: req.body.feedback,
		});

		return successResponse(res, {
			message: 'Quiz attempt reviewed successfully',
			data: attempt,
		});
	} catch (error) {
		return next(error);
	}
};
