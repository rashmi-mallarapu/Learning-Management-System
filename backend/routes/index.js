import express from 'express';

import assignmentRoutes from '../modules/assignment/assignment.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import communicationRoutes from '../modules/communication/communication.routes.js';
import courseRoutes from '../modules/course/course.routes.js';
import enrollmentRoutes from '../modules/enrollment/enrollment.routes.js';
import lessonRoutes from '../modules/lesson/lesson.routes.js';
import progressRoutes from '../modules/progress/progress.routes.js';
import quizRoutes from '../modules/quiz/quiz.routes.js';
import submissionRoutes from '../modules/submission/submission.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import certificateRoutes from '../modules/certificate/certificate.routes.js';
import communityRoutes from '../modules/community/community.routes.js';
import messageRoutes from '../modules/message/message.routes.js';
import announcementRoutes from '../modules/announcement/announcement.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import messageAccessRoutes from '../modules/message-access/messageAccess.routes.js';
import noteRoutes from '../modules/note/note.routes.js';
import discussionRoutes from '../modules/discussion/discussion.routes.js';
import notificationRoutes from '../modules/notification/notification.routes.js';
import reportRoutes from '../modules/report/report.routes.js';
import auditLogRoutes from '../modules/auditLog/auditLog.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'LMS API root',
		health: '/api/health',
		endpoints: [
			'/api/auth',
			'/api/users',
			'/api/courses',
			'/api/enrollments',
			'/api/lessons',
			'/api/assignments',
			'/api/submissions',
			'/api/progress',
			'/api/quizzes',
			'/api/communication',
			'/api/message-access',
			'/api/certificates',
			'/api/community',
			'/api/messages',
			'/api/announcements',
			'/api/dashboard',
			'/api/notes',
			'/api/discussions',
			'/api/notifications',
			'/api/reports',
		],
	});
});

router.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'LMS API is healthy',
	});
});

router.use('/auth', authRoutes);
router.use('/', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/lessons', lessonRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/progress', progressRoutes);
router.use('/quizzes', quizRoutes);
router.use('/communication', communicationRoutes);
router.use('/message-access', messageAccessRoutes);
router.use('/certificates', certificateRoutes);
router.use('/community', communityRoutes);
router.use('/messages', messageRoutes);
router.use('/announcements', announcementRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notes', noteRoutes);
router.use('/discussions', discussionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
