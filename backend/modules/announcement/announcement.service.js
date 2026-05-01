import Announcement from './announcement.model.js';
import Enrollment from '../enrollment/enrollment.model.js';

import { createAppError } from '../../utils/constants.js';

export const createAnnouncement = async ({ title, content, authorId, courseId, audience, pinned }) =>
	Announcement.create({ title, content, authorId, courseId, audience, pinned });

export const getAnnouncements = async (userId, userRole) => {
	const filter = {
		$or: [{ audience: 'all' }],
	};

	if (userRole === 'learner') {
		filter.$or.push({ audience: 'learners' });
		const enrollments = await Enrollment.find({ userId }).select('courseId');
		const courseIds = enrollments.map((e) => e.courseId);
		if (courseIds.length > 0) {
			filter.$or.push({ audience: 'course', courseId: { $in: courseIds } });
		}
	} else if (userRole === 'instructor') {
		filter.$or.push({ audience: 'instructors' });
	}

	return Announcement.find(filter)
		.populate('authorId', 'name email role')
		.populate('courseId', 'title')
		.sort({ pinned: -1, createdAt: -1 });
};

export const getAnnouncementById = async (announcementId) => {
	const announcement = await Announcement.findById(announcementId)
		.populate('authorId', 'name email role')
		.populate('courseId', 'title');

	if (!announcement) {
		throw createAppError('Announcement not found', 404);
	}
	return announcement;
};

export const deleteAnnouncement = async (announcementId) => {
	const announcement = await Announcement.findByIdAndDelete(announcementId);
	if (!announcement) {
		throw createAppError('Announcement not found', 404);
	}
	return announcement;
};
