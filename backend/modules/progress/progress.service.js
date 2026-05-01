import Course from '../course/course.model.js';
import Assignment from '../assignment/assignment.model.js';
import Quiz from '../quiz/quiz.model.js';
import Submission from '../submission/submission.model.js';
import QuizAttempt from '../quiz/quizAttempt.model.js';
import Progress from './progress.model.js';
import { countLessonsByCourseId } from '../lesson/lesson.service.js';

import { createAppError } from '../../utils/constants.js';
import { logEvent } from '../auditLog/auditLog.service.js';

const countUniqueIds = (values = []) => new Set(values.map((value) => String(value))).size;

export const recalculateProgressForCourse = async ({ userId, courseId, progressRecord = null }) => {
	const progress = progressRecord || await Progress.findOne({ userId, courseId }) || new Progress({ userId, courseId, completedLessons: [] });

	const [totalLessons, assignments, quizzes] = await Promise.all([
		countLessonsByCourseId(courseId),
		Assignment.find({ courseId }).select('_id').lean(),
		Quiz.find({ courseId }).select('_id').lean(),
	]);

	const assignmentIds = assignments.map((assignment) => assignment._id);
	const quizIds = quizzes.map((quiz) => quiz._id);

	const [submittedAssignments, completedQuizzes] = await Promise.all([
		assignmentIds.length > 0 ? Submission.distinct('assignmentId', { userId, assignmentId: { $in: assignmentIds } }) : [],
		quizIds.length > 0 ? QuizAttempt.distinct('quizId', { userId, quizId: { $in: quizIds } }) : [],
	]);

	const completedLessons = countUniqueIds(progress.completedLessons || []);
	const completedAssignments = countUniqueIds(submittedAssignments);
	const completedQuizCount = countUniqueIds(completedQuizzes);
	const totalRequirements = totalLessons + assignmentIds.length + quizIds.length;
	const totalCompleted = completedLessons + completedAssignments + completedQuizCount;

	progress.completionPercentage = totalRequirements > 0
		? Math.min(100, Math.round((totalCompleted / totalRequirements) * 100))
		: 0;

	const wasAlreadyComplete = progressRecord?.completionPercentage >= 100;
	await progress.save();

	// Log course completion milestone (only once — when it first hits 100%)
	if (progress.completionPercentage >= 100 && !wasAlreadyComplete) {
		const course = await Course.findById(courseId).select('title');
		await logEvent({
			type: 'system',
			event: `Course completed: "${course?.title || courseId}"`,
			userId,
			severity: 'low',
			meta: { courseId, completionPercentage: 100 },
		});
	}

	return progress;
};

export const upsertProgress = async ({ userId, courseId, lessonId }) => {
	const course = await Course.findById(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	let progress = await Progress.findOne({ userId, courseId });
	if (!progress) {
		progress = new Progress({ userId, courseId, completedLessons: [] });
	}

	if (lessonId && !progress.completedLessons.includes(lessonId)) {
		progress.completedLessons.push(lessonId);
	}

	return recalculateProgressForCourse({ userId, courseId, progressRecord: progress });
};

export const getProgressByUser = async (userId) => {
	const progressRecords = await Progress.find({ userId });

	await Promise.all(
		progressRecords.map((progress) =>
			recalculateProgressForCourse({ userId, courseId: progress.courseId, progressRecord: progress })
		)
	);

	return Progress.find({ userId }).populate('courseId', 'title description');
};
