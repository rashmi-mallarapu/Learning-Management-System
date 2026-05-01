import { successResponse } from '../../utils/responseHandler.js';
import {
	listNotificationsForUser,
	markAllNotificationsReadForUser,
	markNotificationReadForUser,
} from './notification.service.js';
import { createAppError } from '../../utils/constants.js';

export const listMyNotificationsController = async (req, res, next) => {
	try {
		const notifications = await listNotificationsForUser(req.user._id);
		return successResponse(res, {
			message: 'Notifications fetched successfully',
			data: notifications,
		});
	} catch (error) {
		return next(error);
	}
};

export const markNotificationReadController = async (req, res, next) => {
	try {
		const notification = await markNotificationReadForUser({
			notificationId: req.params.notificationId,
			userId: req.user._id,
		});

		if (!notification) {
			throw createAppError('Notification not found', 404);
		}

		return successResponse(res, {
			message: 'Notification marked as read',
			data: notification,
		});
	} catch (error) {
		return next(error);
	}
};

export const markAllNotificationsReadController = async (req, res, next) => {
	try {
		const notifications = await markAllNotificationsReadForUser(req.user._id);
		return successResponse(res, {
			message: 'All notifications marked as read',
			data: notifications,
		});
	} catch (error) {
		return next(error);
	}
};
