import { successResponse } from '../../utils/responseHandler.js';

import { createAnnouncement, getAnnouncements, getAnnouncementById, deleteAnnouncement } from './announcement.service.js';
import { logEvent } from '../auditLog/auditLog.service.js';

export const createAnnouncementController = async (req, res, next) => {
	try {
		const announcement = await createAnnouncement({
			title: req.body.title,
			content: req.body.content,
			authorId: req.user._id,
			courseId: req.body.courseId || null,
			audience: req.body.audience || 'all',
			pinned: req.body.pinned || false,
		});

		await logEvent({
			type: 'content',
			event: `Announcement created: "${req.body.title}"`,
			user: req.user.name,
			userId: req.user._id,
			ip: req.ip || 'unknown',
			severity: 'low',
			meta: { audience: req.body.audience || 'all', pinned: req.body.pinned || false },
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Announcement created successfully',
			data: announcement,
		});
	} catch (error) {
		return next(error);
	}
};

export const listAnnouncementsController = async (req, res, next) => {
	try {
		const announcements = await getAnnouncements(req.user._id, req.user.role);
		return successResponse(res, {
			message: 'Announcements fetched successfully',
			data: announcements,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAnnouncementController = async (req, res, next) => {
	try {
		const announcement = await getAnnouncementById(req.params.announcementId);
		return successResponse(res, {
			message: 'Announcement fetched successfully',
			data: announcement,
		});
	} catch (error) {
		return next(error);
	}
};

export const deleteAnnouncementController = async (req, res, next) => {
	try {
		await deleteAnnouncement(req.params.announcementId);

		await logEvent({
			type: 'content',
			event: `Announcement deleted`,
			user: req.user.name,
			userId: req.user._id,
			ip: req.ip || 'unknown',
			severity: 'medium',
		});

		return successResponse(res, {
			message: 'Announcement deleted successfully',
		});
	} catch (error) {
		return next(error);
	}
};
