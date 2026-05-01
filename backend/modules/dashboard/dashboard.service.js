import Enrollment from '../enrollment/enrollment.model.js';
import Progress from '../progress/progress.model.js';
import Course from '../course/course.model.js';
import Certificate from '../certificate/certificate.model.js';
import QuizAttempt from '../quiz/quizAttempt.model.js';
import Submission from '../submission/submission.model.js';
import User from '../user/user.model.js';
import Assignment from '../assignment/assignment.model.js';
import Lesson from '../lesson/lesson.model.js';
import Quiz from '../quiz/quiz.model.js';
import { recalculateProgressForCourse } from '../progress/progress.service.js';

const parseDurationToMinutes = (value) => {
	if (value === null || value === undefined) return 0;
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value > 10 ? value / 60 : value;
	}

	const input = String(value).trim().toLowerCase();
	if (!input) return 0;

	const hoursMatch = input.match(/(\d+(?:\.\d+)?)\s*h/);
	const minutesMatch = input.match(/(\d+(?:\.\d+)?)\s*m/);
	const secondsMatch = input.match(/(\d+(?:\.\d+)?)\s*s/);

	const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
	const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
	const seconds = secondsMatch ? Number(secondsMatch[1]) : 0;

	if (hours || minutes || seconds) {
		return hours * 60 + minutes + seconds / 60;
	}

	const numeric = Number(input.replace(/[^\d.]/g, ''));
	return Number.isFinite(numeric) ? numeric : 0;
};

const roundHours = (minutes = 0) => Number((minutes / 60).toFixed(1));
const quizSecondsToMinutes = (seconds = 0) => {
	const numeric = Number(seconds);
	if (!Number.isFinite(numeric) || numeric <= 0) return 0;
	return numeric / 60;
};

export const getLearnerDashboardStats = async (userId) => {
	const enrollments = await Enrollment.find({ userId }).populate('courseId', 'title category thumbnail');
	const progressRecords = await Progress.find({ userId });
	await Promise.all(
		progressRecords.map((progress) =>
			recalculateProgressForCourse({ userId, courseId: progress.courseId, progressRecord: progress })
		)
	);
	const refreshedProgressRecords = await Progress.find({ userId });
	const certificates = await Certificate.find({ userId });
	const quizAttempts = await QuizAttempt.find({ userId });
	const attemptedQuizIds = [...new Set(quizAttempts.map((attempt) => attempt.quizId?.toString()).filter(Boolean))];
	const completedLessonIds = [
		...new Set(
			refreshedProgressRecords.flatMap((progress) =>
				(progress.completedLessons || []).map((lessonId) => lessonId.toString())
			)
		),
	];
	const completedLessons = completedLessonIds.length > 0
		? await Lesson.find({ _id: { $in: completedLessonIds } }).select('courseId title duration')
		: [];
	const attemptedQuizzes = attemptedQuizIds.length > 0
		? await Quiz.find({ _id: { $in: attemptedQuizIds } }).select('courseId title')
		: [];
	const lessonById = new Map(completedLessons.map((lesson) => [lesson._id.toString(), lesson]));
	const quizById = new Map(attemptedQuizzes.map((quiz) => [quiz._id.toString(), quiz]));

	const enrolledCourses = enrollments.length;
	const completedCourses = refreshedProgressRecords.filter((p) => p.completionPercentage >= 100).length;
	const certificateCount = certificates.length;

	const avgScore =
		quizAttempts.length > 0
			? Number((quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length).toFixed(1))
			: 0;
	const courseLearningMinutes = refreshedProgressRecords.reduce((acc, progress) => {
		const courseId = progress.courseId.toString();
		const minutes = (progress.completedLessons || []).reduce((sum, lessonId) => {
			const lesson = lessonById.get(lessonId.toString());
			return sum + parseDurationToMinutes(lesson?.duration);
		}, 0);

		if (minutes <= 0) return acc;

		const existing = acc.get(courseId) || {
			courseId,
			title: enrollments.find((entry) => entry.courseId?._id?.toString() === courseId)?.courseId?.title || 'Course',
			minutes: 0,
		};
		existing.minutes += minutes;
		acc.set(courseId, existing);
		return acc;
	}, new Map());
	quizAttempts.forEach((attempt) => {
		const quiz = quizById.get(attempt.quizId?.toString());
		const courseId = quiz?.courseId?.toString();
		const minutes = quizSecondsToMinutes(attempt.timeTaken);

		if (!courseId || minutes <= 0) return;

		const existing = courseLearningMinutes.get(courseId) || {
			courseId,
			title: enrollments.find((entry) => entry.courseId?._id?.toString() === courseId)?.courseId?.title || 'Course',
			minutes: 0,
		};
		existing.minutes += minutes;
		courseLearningMinutes.set(courseId, existing);
	});
	const learningHoursChart = Array.from(courseLearningMinutes.values())
		.sort((a, b) => b.minutes - a.minutes)
		.slice(0, 3)
		.map((entry, index) => ({
			label: entry.title.length > 12 ? entry.title.slice(0, 12) : entry.title || `C${index + 1}`,
			hours: roundHours(entry.minutes),
			fullTitle: entry.title,
		}));
	const totalLearningHours = roundHours(
		Array.from(courseLearningMinutes.values()).reduce((sum, entry) => sum + entry.minutes, 0)
	);

	return {
		enrolledCourses,
		completedCourses,
		certificates: certificateCount,
		avgScore,
		totalLearningHours,
		learningHoursChart,
		totalQuizAttempts: quizAttempts.length,
		enrollments: enrollments.map((e) => ({
			_id: e._id,
			courseId: e.courseId,
			enrolledAt: e.enrolledAt,
			progress: refreshedProgressRecords.find((p) => p.courseId.toString() === e.courseId._id.toString())?.completionPercentage || 0,
		})),
	};
};

export const getLeaderboard = async () => {
	const [quizAttempts, enrollmentCounts, completedCounts, certificateCounts] = await Promise.all([
		QuizAttempt.aggregate([
			{
				$group: {
					_id: '$userId',
					totalScore: { $sum: '$score' },
					totalQuizzes: { $sum: 1 },
					avgPercentage: { $avg: '$percentage' },
					totalQuizSeconds: { $sum: '$timeTaken' },
				},
			},
		]),
		Enrollment.aggregate([
			{ $group: { _id: '$userId', courseCount: { $sum: 1 } } },
		]),
		Progress.aggregate([
			{
				$group: {
					_id: '$userId',
					completed: {
						$sum: {
							$cond: [{ $gte: ['$completionPercentage', 100] }, 1, 0],
						},
					},
					avgCompletion: { $avg: '$completionPercentage' },
				},
			},
		]),
		Certificate.aggregate([
			{ $group: { _id: '$userId', certificates: { $sum: 1 } } },
		]),
	]);

	const statsMap = new Map();
	const ensureEntry = (userId) => {
		const key = userId.toString();
		if (!statsMap.has(key)) {
			statsMap.set(key, {
				userId: key,
				totalScore: 0,
				totalQuizzes: 0,
				totalQuizSeconds: 0,
				avgPercentage: 0,
				coursesEnrolled: 0,
				coursesCompleted: 0,
				certificates: 0,
				avgCompletion: 0,
			});
		}
		return statsMap.get(key);
	};

	quizAttempts.forEach((entry) => {
		const current = ensureEntry(entry._id);
		current.totalScore = entry.totalScore || 0;
		current.totalQuizzes = entry.totalQuizzes || 0;
		current.totalQuizSeconds = entry.totalQuizSeconds || 0;
		current.avgPercentage = Number((entry.avgPercentage || 0).toFixed(1));
	});

	enrollmentCounts.forEach((entry) => {
		const current = ensureEntry(entry._id);
		current.coursesEnrolled = entry.courseCount || 0;
	});

	completedCounts.forEach((entry) => {
		const current = ensureEntry(entry._id);
		current.coursesCompleted = entry.completed || 0;
		current.avgCompletion = Number((entry.avgCompletion || 0).toFixed(1));
	});

	certificateCounts.forEach((entry) => {
		const current = ensureEntry(entry._id);
		current.certificates = entry.certificates || 0;
	});

	const userIds = Array.from(statsMap.keys());
	if (userIds.length === 0) {
		return [];
	}

	const users = await User.find({ _id: { $in: userIds } }).select('name email role');
	const userMap = new Map(users.map((user) => [user._id.toString(), user]));

	return Array.from(statsMap.values())
		.filter((entry) => userMap.has(entry.userId))
		.map((entry) => ({
			...entry,
			compositeScore:
				entry.totalScore +
				entry.coursesCompleted * 180 +
				entry.certificates * 200 +
				entry.coursesEnrolled * 20 +
				Math.round(entry.avgCompletion || 0) +
				Math.round(quizSecondsToMinutes(entry.totalQuizSeconds || 0)),
		}))
		sort((a, b) => {
			if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
			if (b.coursesCompleted !== a.coursesCompleted) return b.coursesCompleted - a.coursesCompleted;
			return b.avgPercentage - a.avgPercentage;
		})
		.slice(0, 50)
		.map((entry, index) => ({
			rank: index + 1,
			user: userMap.get(entry.userId) || { name: 'Unknown', email: '' },
			totalScore: entry.compositeScore,
			totalQuizzes: entry.totalQuizzes,
			totalQuizMinutes: Number(quizSecondsToMinutes(entry.totalQuizSeconds || 0).toFixed(1)),
			avgPercentage: entry.avgPercentage,
			coursesEnrolled: entry.coursesEnrolled,
			coursesCompleted: entry.coursesCompleted,
			certificates: entry.certificates,
		}));
};

export const getGradesForLearner = async (userId) => {
	const quizAttempts = await QuizAttempt.find({ userId })
		.populate('quizId', 'title courseId passingScore')
		.sort({ completedAt: -1 });

	const submissions = await Submission.find({ userId })
		.populate('assignmentId', 'title courseId points')
		.sort({ _id: -1 });

	const courseIds = [
		...new Set([
			...quizAttempts.filter((a) => a.quizId?.courseId).map((a) => a.quizId.courseId.toString()),
			...submissions.filter((s) => s.assignmentId?.courseId).map((s) => s.assignmentId.courseId.toString()),
		]),
	];

	const courses = await Course.find({ _id: { $in: courseIds } }).select('title category');
	const courseMap = {};
	courses.forEach((c) => {
		courseMap[c._id.toString()] = c;
	});

	return {
		quizGrades: quizAttempts.map((a) => ({
			_id: a._id,
			quizTitle: a.quizId?.title || 'Unknown Quiz',
			courseTitle: courseMap[a.quizId?.courseId?.toString()]?.title || 'Unknown Course',
			score: a.score,
			total: a.total,
			percentage: a.percentage,
			passed: a.passed,
			completedAt: a.completedAt,
		})),
		assignmentGrades: submissions
			.filter((s) => s.grade !== null && s.grade !== undefined)
			.map((s) => ({
				_id: s._id,
				assignmentTitle: s.assignmentId?.title || 'Unknown Assignment',
				courseTitle: courseMap[s.assignmentId?.courseId?.toString()]?.title || 'Unknown Course',
				grade: s.grade,
				totalPoints: s.assignmentId?.points || 100,
				percentage: s.assignmentId?.points ? Number(((s.grade / s.assignmentId.points) * 100).toFixed(1)) : 0,
			})),
	};
};

export const getInstructorDashboardStats = async (instructorId) => {
	const courses = await Course.find({ instructorId }).lean();
	const courseIds = courses.map((course) => course._id);

	if (courseIds.length === 0) {
		return {
			totalEnrollments: 0,
			pendingGrading: 0,
			avgRating: 0,
			totalCourses: 0,
			avgAttendance: 0,
			recentEnrollments: [],
			retentionData: [],
			recentEvents: [],
			topCourse: null,
			creatorInsight: {
				title: 'Build your first live course signal',
				body: 'Publish a course and enroll learners to unlock live retention, activity, and performance insights here.',
				ctaLabel: 'Create Course',
			},
		};
	}

	const courseMap = new Map(courses.map((course) => [course._id.toString(), course]));

	const [enrollmentCounts, progressStats, assignments, recentEnrollments] = await Promise.all([
		Enrollment.aggregate([
			{ $match: { courseId: { $in: courseIds } } },
			{
				$group: {
					_id: '$courseId',
					count: { $sum: 1 },
					latestEnrollmentAt: { $max: '$enrolledAt' },
				},
			},
		]),
		Progress.aggregate([
			{ $match: { courseId: { $in: courseIds } } },
			{
				$group: {
					_id: '$courseId',
					completed: {
						$sum: {
							$cond: [{ $gte: ['$completionPercentage', 100] }, 1, 0],
						},
					},
					active: {
						$sum: {
							$cond: [{ $gt: ['$completionPercentage', 0] }, 1, 0],
						},
					},
					averageProgress: { $avg: '$completionPercentage' },
				},
			},
		]),
		Assignment.find({ courseId: { $in: courseIds } }).select('_id courseId title').lean(),
		Enrollment.find({ courseId: { $in: courseIds } })
			.sort({ enrolledAt: -1 })
			.limit(5)
			.populate('userId', 'name email'),
	]);

	const assignmentIds = assignments.map((assignment) => assignment._id);
	const assignmentMap = new Map(assignments.map((assignment) => [assignment._id.toString(), assignment]));
	const enrollmentCountMap = new Map(enrollmentCounts.map((item) => [item._id.toString(), item]));
	const progressMap = new Map(progressStats.map((item) => [item._id.toString(), item]));

	const pendingSubmissionFilter = assignmentIds.length > 0 ? { assignmentId: { $in: assignmentIds }, grade: null } : null;
	const [pendingGrading, recentPendingSubmissions] = pendingSubmissionFilter
		? await Promise.all([
				Submission.countDocuments(pendingSubmissionFilter),
				Submission.find(pendingSubmissionFilter)
					.sort({ createdAt: -1 })
					.limit(5)
					.populate('userId', 'name email')
					.populate({
						path: 'assignmentId',
						select: 'title courseId',
						populate: {
							path: 'courseId',
							select: 'title',
						},
					}),
		  ])
		: [0, []];

	const coursePerformance = courses
		.map((course) => {
			const courseId = course._id.toString();
			const enrollments = enrollmentCountMap.get(courseId)?.count || 0;
			const progress = progressMap.get(courseId);
			const completed = progress?.completed || 0;
			const activeLearners = progress?.active || 0;
			const retentionRate = enrollments > 0 ? Math.round((completed / enrollments) * 100) : 0;
			const dropoffRate = enrollments > 0 ? Math.max(0, 100 - retentionRate) : 0;
			const averageProgress = progress?.averageProgress ? Number(progress.averageProgress.toFixed(1)) : 0;

			return {
				courseId: course._id,
				title: course.title,
				category: course.category || 'General',
				status: course.status,
				rating: Number((course.rating || 0).toFixed(1)),
				reviewCount: course.reviewCount || 0,
				enrollments,
				activeLearners,
				completedLearners: completed,
				retentionRate,
				dropoffRate,
				averageProgress,
				googleClassroom: course.googleClassroom || {},
				createdAt: course.createdAt,
			};
		})
		.sort((a, b) => {
			if (b.enrollments !== a.enrollments) {
				return b.enrollments - a.enrollments;
			}

			if (b.retentionRate !== a.retentionRate) {
				return b.retentionRate - a.retentionRate;
			}

			return b.rating - a.rating;
		});

	const totalEnrollments = coursePerformance.reduce((sum, course) => sum + course.enrollments, 0);
	const totalActiveLearners = coursePerformance.reduce((sum, course) => sum + course.activeLearners, 0);
	const avgAttendance = totalEnrollments > 0 ? Number(((totalActiveLearners / totalEnrollments) * 100).toFixed(1)) : 0;
	const avgRating =
		coursePerformance.length > 0
			? Number(
					(
						coursePerformance.reduce((sum, course) => sum + (course.rating || 0), 0) /
						coursePerformance.length
					).toFixed(1)
			  )
			: 0;

	const retentionData = coursePerformance.slice(0, 6).map((course) => ({
		name: course.title,
		completion: course.retentionRate,
		dropoff: course.dropoffRate,
		enrollments: course.enrollments,
		averageProgress: course.averageProgress,
	}));

	const recentEvents = [
		...recentEnrollments.map((enrollment) => ({
			type: 'enrollment',
			title: 'New Student Enrollment',
			description: `${enrollment.userId?.name || 'A learner'} joined ${
				courseMap.get(enrollment.courseId.toString())?.title || 'your course'
			}`,
			occurredAt: enrollment.enrolledAt,
		})),
		...recentPendingSubmissions.map((submission) => ({
			type: 'submission',
			title: 'Submission Ready to Grade',
			description: `${submission.userId?.name || 'A learner'} submitted ${
				submission.assignmentId?.title || 'an assignment'
			}`,
			occurredAt: submission.createdAt,
		})),
		...coursePerformance
			.filter((course) => course.status === 'published')
			.slice(0, 3)
			.map((course) => ({
				type: 'course',
				title: 'Published Course Active',
				description: `${course.title} is live with ${course.enrollments} enrolled learners`,
				occurredAt: course.createdAt,
			})),
	]
		.filter((event) => event.occurredAt)
		.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
		.slice(0, 6);

	const topCourse = coursePerformance[0] || null;
	const creatorInsight = topCourse
		? {
				title: `${topCourse.title} leads your catalog`,
				body: `${topCourse.enrollments} learners enrolled, ${topCourse.retentionRate}% course completion, and a ${topCourse.rating.toFixed(
					1
				)}/5 rating are making it your strongest performer right now.`,
				ctaLabel: 'View Trends',
		  }
		: {
				title: 'Build your first live course signal',
				body: 'Publish a course and enroll learners to unlock live retention, activity, and performance insights here.',
				ctaLabel: 'Create Course',
		  };

	return {
		totalEnrollments,
		pendingGrading,
		avgRating,
		totalCourses: courses.length,
		avgAttendance,
		recentEnrollments: recentEnrollments.map((enrollment) => ({
			studentName: enrollment.userId?.name,
			courseTitle: courseMap.get(enrollment.courseId.toString())?.title,
			date: enrollment.enrolledAt,
		})),
		retentionData,
		recentEvents,
		topCourse,
		coursePerformance,
		creatorInsight,
	};
};
