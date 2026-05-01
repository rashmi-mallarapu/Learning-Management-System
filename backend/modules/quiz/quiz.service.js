import mongoose from 'mongoose';
import Course from '../course/course.model.js';
import Quiz from './quiz.model.js';
import QuizAttempt from './quizAttempt.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Lesson from '../lesson/lesson.model.js';
import Progress from '../progress/progress.model.js';
import { recalculateProgressForCourse } from '../progress/progress.service.js';

import { ROLES, createAppError } from '../../utils/constants.js';
import { logEvent } from '../auditLog/auditLog.service.js';

const DEFAULT_MAX_ATTEMPTS = 3;

const toIdString = (value) => {
	if (!value) {
		return '';
	}

	if (typeof value === 'object' && value._id) {
		return value._id.toString();
	}

	return value.toString();
};

const buildAttemptMap = (attempts) => {
	const attemptMap = new Map();

	attempts.forEach((attempt) => {
		const key = toIdString(attempt.quizId);
		if (!attemptMap.has(key)) {
			attemptMap.set(key, []);
		}
		attemptMap.get(key).push(attempt);
	});

	return attemptMap;
};

const buildCompletedLessonsMap = (progressRecords) => {
	const progressMap = new Map();

	progressRecords.forEach((progress) => {
		progressMap.set(
			toIdString(progress.courseId),
			new Set((progress.completedLessons || []).map((lessonId) => toIdString(lessonId)))
		);
	});

	return progressMap;
};

const buildLessonsByCourseMap = (lessons) => {
	const lessonsByCourse = new Map();

	lessons.forEach((lesson) => {
		const courseKey = toIdString(lesson.courseId);
		if (!lessonsByCourse.has(courseKey)) {
			lessonsByCourse.set(courseKey, new Map());
		}
		lessonsByCourse.get(courseKey).set(Number(lesson.order), lesson);
	});

	return lessonsByCourse;
};

const buildCourseIdMatchers = (courseIds) => {
	const stringIds = [...new Set(courseIds.map((courseId) => toIdString(courseId)).filter(Boolean))];
	const objectIds = stringIds
		.filter((courseId) => mongoose.isValidObjectId(courseId))
		.map((courseId) => new mongoose.Types.ObjectId(courseId));

	return [...stringIds, ...objectIds];
};

const findLessonsForCourseIds = async (courseIds) => {
	return Lesson.collection
		.find({ courseId: { $in: buildCourseIdMatchers(courseIds) } })
		.project({ _id: 1, courseId: 1, title: 1, order: 1 })
		.sort({ order: 1, _id: 1 })
		.toArray();
};

const findQuizIdsByCourseIds = async (courseIds) => {
	const matchers = buildCourseIdMatchers(courseIds);
	if (matchers.length === 0) {
		return [];
	}

	const rawQuizzes = await Quiz.collection
		.find({ courseId: { $in: matchers } }, { projection: { _id: 1 } })
		.toArray();

	return rawQuizzes.map((quiz) => quiz._id);
};

const findQuizIdByCourseAndLessonOrder = async (courseId, lessonOrder) => {
	const rawQuiz = await Quiz.collection.findOne(
		{
			courseId: { $in: buildCourseIdMatchers([courseId]) },
			lessonOrder: Number(lessonOrder),
		},
		{ projection: { _id: 1 } }
	);

	return rawQuiz?._id || null;
};

const getBestAttempt = (attempts = []) =>
	attempts.reduce((best, attempt) => (!best || attempt.percentage > best.percentage ? attempt : best), null);

const buildLockedRequirement = (lessonOrder, lessonTitle) => {
	if (lessonTitle) {
		return `Complete "${lessonTitle}" to unlock this quiz.`;
	}

	if (lessonOrder) {
		return `Complete Lesson ${lessonOrder} to unlock this quiz.`;
	}

	return 'Complete the lesson video to unlock this quiz.';
};

const normalizeMaxAttempts = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ATTEMPTS;
};

const normalizeQuizQuestions = (questions = []) => {
	if (!Array.isArray(questions)) {
		return [];
	}

	return questions
		.map((question) => ({
			type: question.type || 'multiple_choice',
			question: String(question.question || '').trim(),
			options: Array.isArray(question.options)
				? question.options.map((option) => String(option || '').trim()).filter(Boolean)
				: [],
			correctAnswer: question.type === 'survey' ? '' : String(question.correctAnswer || '').trim(),
			points: Number.isFinite(Number(question.points)) ? Number(question.points) : 1,
			explanation: String(question.explanation || '').trim(),
		}))
		.filter((question) => question.question && (question.type === 'survey' || question.correctAnswer));
};

const decorateLearnerQuiz = (quiz, attemptMap, completedLessonsMap, lessonsByCourse) => {
	const quizObject = typeof quiz.toObject === 'function' ? quiz.toObject() : { ...quiz };
	const quizId = toIdString(quizObject._id);
	const courseKey = toIdString(quizObject.courseId);
	const lessonOrder = Number(quizObject.lessonOrder);
	const mappedLesson = Number.isFinite(lessonOrder) && lessonOrder > 0
		? lessonsByCourse.get(courseKey)?.get(lessonOrder) || null
		: null;
	const completedLessons = completedLessonsMap.get(courseKey) || new Set();
	const quizAttempts = attemptMap.get(quizId) || [];
	const bestAttempt = getBestAttempt(quizAttempts);
	const questionCount = Array.isArray(quizObject.questions) ? quizObject.questions.length : 0;
	const lessonCompleted = !!mappedLesson && completedLessons.has(toIdString(mappedLesson._id));
	const isLocked = !!mappedLesson && !lessonCompleted;
	const isPassed = !!bestAttempt?.passed;

	return {
		...quizObject,
		attempts: quizAttempts.length,
		attemptsUsed: quizAttempts.length,
		bestScore: bestAttempt?.score ?? null,
		bestTotal: bestAttempt?.total ?? null,
		score: bestAttempt?.percentage ?? null,
		passed: bestAttempt?.passed ?? null,
		status: isPassed ? 'completed' : isLocked ? 'locked' : 'available',
		isLocked,
		lessonTitle: mappedLesson?.title ?? null,
		requirement: isLocked ? buildLockedRequirement(lessonOrder, mappedLesson?.title) : null,
		questionCount,
		maxAttempts: normalizeMaxAttempts(quizObject.maxAttempts),
	};
};

const decorateLearnerQuizzes = async (quizzes, userId) => {
	if (!Array.isArray(quizzes) || quizzes.length === 0) {
		return [];
	}

	const courseIds = [...new Set(quizzes.map((quiz) => toIdString(quiz.courseId)).filter(Boolean))];
	const quizIds = quizzes.map((quiz) => quiz._id);

	const [attempts, progressRecords, lessons] = await Promise.all([
		QuizAttempt.find({ userId, quizId: { $in: quizIds } }).sort({ completedAt: -1 }),
		Progress.find({ userId, courseId: { $in: courseIds } }).select('courseId completedLessons'),
		findLessonsForCourseIds(courseIds),
	]);

	const attemptMap = buildAttemptMap(attempts);
	const completedLessonsMap = buildCompletedLessonsMap(progressRecords);
	const lessonsByCourse = buildLessonsByCourseMap(lessons);

	return quizzes.map((quiz) => decorateLearnerQuiz(quiz, attemptMap, completedLessonsMap, lessonsByCourse));
};

const getLearnerQuizView = async (quiz, userId) => {
	const [learnerQuiz] = await decorateLearnerQuizzes([quiz], userId);
	return learnerQuiz || null;
};

const assertLearnerQuizAccess = async (quiz, userId) => {
	const courseId = quiz.courseId?._id || quiz.courseId;
	const isEnrolled = await Enrollment.exists({ userId, courseId });

	if (!isEnrolled) {
		throw createAppError('You are not enrolled in this course', 403);
	}

	const learnerQuiz = await getLearnerQuizView(quiz, userId);
	if (learnerQuiz?.isLocked) {
		throw createAppError(learnerQuiz.requirement || 'Complete the lesson video to unlock this quiz.', 403);
	}

	return learnerQuiz;
};

export const getEnrolledLearnerIdsByCourse = async (courseId) => {
	const enrollments = await Enrollment.find({ courseId }).select('userId');
	return enrollments.map((e) => String(e.userId));
};

export const createQuiz = async ({ courseId, title, questions, timeLimit, passingScore, lessonOrder, createdBy, creatorRole }) => {
	const course = await Course.findById(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	// Validate instructor owns the course
	if (creatorRole === ROLES.INSTRUCTOR && String(course.instructorId) !== String(createdBy)) {
		throw createAppError('You can only add quizzes to your own courses', 403);
	}

	const normalizedQuestions = normalizeQuizQuestions(questions);
	if (normalizedQuestions.length === 0) {
		throw createAppError('Quiz must include at least one question', 400);
	}

	return Quiz.create({
		courseId,
		title,
		questions: normalizedQuestions,
		timeLimit,
		passingScore,
		lessonOrder: Number.isFinite(Number(lessonOrder)) ? Number(lessonOrder) : null,
		createdBy,
	});
};

export const submitQuizAnswers = async ({ quizId, userId, answers, timeTaken, requester }) => {
	const quiz = await Quiz.findById(quizId);
	if (!quiz) {
		throw createAppError('Quiz not found', 404);
	}

	if (requester?.role === ROLES.LEARNER) {
		await assertLearnerQuizAccess(quiz, requester._id);
	}

	if (!Array.isArray(answers)) {
		throw createAppError('Answers must be an array', 400);
	}

	const gradableQuestions = quiz.questions.filter((question) => question.type !== 'survey');
	const total = gradableQuestions.length;

	const attempt = await QuizAttempt.create({
		quizId,
		userId,
		answers,
		score: null,
		total,
		percentage: null,
		passed: null,
		status: 'pending',
		timeTaken: timeTaken || 0,
	});

	await recalculateProgressForCourse({ userId, courseId: quiz.courseId });

	await logEvent({
		type: 'mod',
		event: `Quiz submitted: "${quiz.title}"`,
		userId,
		severity: 'low',
		meta: { quizId, totalQuestions: total },
	});

	return {
		attemptId: attempt._id,
		quizId: quiz._id,
		quizTitle: quiz.title,
		total,
		status: 'pending',
		reviewRequired: true,
		submittedAt: attempt.completedAt,
	};
};

export const getQuizzesByCourse = async (courseId, requester) => {
	const quizIds = await findQuizIdsByCourseIds([courseId]);
	if (quizIds.length === 0) {
		return [];
	}

	const quizzes = await Quiz.find({ _id: { $in: quizIds } })
		.select('-questions.correctAnswer')
		.populate('courseId', 'title category difficulty')
		.sort({ lessonOrder: 1, createdAt: -1 });

	if (requester?.role === ROLES.LEARNER) {
		return decorateLearnerQuizzes(quizzes, requester._id);
	}

	return quizzes;
};

export const getQuizByLessonOrder = async (courseId, lessonOrder, requester) => {
	const quizId = await findQuizIdByCourseAndLessonOrder(courseId, lessonOrder);
	if (!quizId) {
		return null;
	}

	const quiz = await Quiz.findById(quizId)
		.select('-questions.correctAnswer')
		.populate('courseId', 'title difficulty');

	if (requester?.role === ROLES.LEARNER) {
		const learnerQuiz = await getLearnerQuizView(quiz, requester._id);
		if (learnerQuiz?.isLocked) {
			return {
				...learnerQuiz,
				questions: [],
			};
		}
		return learnerQuiz;
	}

	return quiz;
};

export const getQuizById = async (quizId, requester) => {
	const quiz = await Quiz.findById(quizId)
		.select('-questions.correctAnswer')
		.populate('courseId', 'title difficulty');
	if (!quiz) {
		throw createAppError('Quiz not found', 404);
	}

	if (requester?.role === ROLES.LEARNER) {
		return assertLearnerQuizAccess(quiz, requester._id);
	}

	return quiz;
};

export const getQuizzesForLearner = async (userId) => {
	const enrollments = await Enrollment.find({ userId }).select('courseId');
	const courseIds = enrollments.map((e) => e.courseId);
	const quizIds = await findQuizIdsByCourseIds(courseIds);

	if (quizIds.length === 0) {
		return [];
	}

	const quizzes = await Quiz.find({ _id: { $in: quizIds } })
		.select('-questions.correctAnswer')
		.populate('courseId', 'title category difficulty')
		.sort({ lessonOrder: 1, createdAt: -1 });

	return decorateLearnerQuizzes(quizzes, userId);
};

export const getQuizzesForInstructor = async (instructorId) => {
	const ownedCourses = await Course.find({ instructorId }).select('_id').lean();
	const courseIds = ownedCourses.map((course) => course._id);

	if (courseIds.length === 0) {
		return [];
	}

	const quizIds = await findQuizIdsByCourseIds(courseIds);
	if (quizIds.length === 0) {
		return [];
	}

	return Quiz.find({ _id: { $in: quizIds } })
		.populate('courseId', 'title category difficulty')
		.sort({ lessonOrder: 1, createdAt: -1 });
};

export const getQuizAttemptResult = async (attemptId) => {
	const attempt = await QuizAttempt.findById(attemptId)
		.populate('quizId', 'title courseId passingScore questions');

	if (!attempt) {
		throw createAppError('Quiz attempt not found', 404);
	}

	return attempt;
};

export const getQuizAttemptsByUser = async (userId, quizId) => {
	const attempts = await QuizAttempt.find({ userId, quizId })
		.sort({ completedAt: -1 })
		.populate('quizId', 'title passingScore');

	return attempts;
};

export const getQuizAttemptsForInstructor = async ({ instructorId, status = 'all' }) => {
	const ownedCourses = await Course.find({ instructorId }).select('_id').lean();
	const courseIds = ownedCourses.map((course) => course._id);

	if (courseIds.length === 0) {
		return [];
	}

	const quizzes = await Quiz.find({ courseId: { $in: courseIds } }).select('_id').lean();
	const quizIds = quizzes.map((quiz) => quiz._id);

	if (quizIds.length === 0) {
		return [];
	}

	const filter = { quizId: { $in: quizIds } };
	if (status === 'pending') {
		filter.reviewedAt = null;
	}
	if (status === 'graded') {
		filter.reviewedAt = { $ne: null };
	}

	return QuizAttempt.find(filter)
		.populate('userId', 'name email')
		.populate('reviewedBy', 'name email')
		.populate({
			path: 'quizId',
			select: 'title courseId passingScore timeLimit',
			populate: {
				path: 'courseId',
				select: 'title',
			},
		})
		.sort({ completedAt: -1 });
};

export const reviewQuizAttempt = async ({ attemptId, instructorId, percentage, feedback }) => {
	const attempt = await QuizAttempt.findById(attemptId).populate({
		path: 'quizId',
		select: 'title courseId passingScore',
		populate: {
			path: 'courseId',
			select: 'title instructorId',
		},
	});

	if (!attempt) {
		throw createAppError('Quiz attempt not found', 404);
	}

	if (String(attempt.quizId?.courseId?.instructorId) !== String(instructorId)) {
		throw createAppError('You can review attempts only for your own courses', 403);
	}

	const parsedPercentage = Number(percentage);
	if (!Number.isFinite(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
		throw createAppError('Quiz grade must be a number between 0 and 100', 400);
	}

	attempt.percentage = Number(parsedPercentage.toFixed(2));
	attempt.score = Number(((attempt.total * parsedPercentage) / 100).toFixed(2));
	attempt.passed = attempt.percentage >= (attempt.quizId?.passingScore || 70);
	attempt.status = 'reviewed';
	attempt.feedback = feedback || '';
	attempt.reviewedBy = instructorId;
	attempt.reviewedAt = new Date();
	await attempt.save();

	await logEvent({
		type: 'mod',
		event: `Quiz attempt reviewed: "${attempt.quizId?.title}" — ${attempt.percentage}% (${attempt.passed ? 'Passed' : 'Failed'})`,
		userId: instructorId,
		severity: attempt.passed ? 'low' : 'medium',
		meta: { attemptId, percentage: attempt.percentage, passed: attempt.passed },
	});

	return QuizAttempt.findById(attemptId)
		.populate('userId', 'name email')
		.populate('reviewedBy', 'name email')
		.populate({
			path: 'quizId',
			select: 'title courseId passingScore timeLimit',
			populate: {
				path: 'courseId',
				select: 'title',
			},
		});
};
