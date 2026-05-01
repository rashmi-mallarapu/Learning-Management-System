import Notification from './notification.model.js';
import { emitToUser } from '../../config/socket.js';

export const serializeNotification = (notificationDoc) => ({
	id: notificationDoc._id,
	_id: notificationDoc._id,
	title: notificationDoc.title,
	message: notificationDoc.message,
	type: notificationDoc.type,
	link: notificationDoc.link || '',
	data: notificationDoc.data || {},
	read: Boolean(notificationDoc.readAt),
	readAt: notificationDoc.readAt,
	createdAt: notificationDoc.createdAt,
});

export const createNotification = async ({ recipientId, title, message, type = 'general', link = '', data = {} }) => {
	const notification = await Notification.create({
		recipientId,
		title,
		message,
		type,
		link,
		data,
	});

	const serialized = serializeNotification(notification);
	emitToUser(recipientId, 'notification:new', serialized);
	return serialized;
};

export const createNotificationsForUsers = async (userIds = [], payload = {}) => {
	if (!Array.isArray(userIds) || userIds.length === 0) {
		return [];
	}

	const uniqueIds = [...new Set(userIds.map((id) => String(id)).filter(Boolean))];
	const docs = await Notification.insertMany(
		uniqueIds.map((recipientId) => ({
			recipientId,
			title: payload.title,
			message: payload.message,
			type: payload.type || 'general',
			link: payload.link || '',
			data: payload.data || {},
		}))
	);

	const serialized = docs.map(serializeNotification);
	serialized.forEach((notification, index) => {
		emitToUser(uniqueIds[index], 'notification:new', notification);
	});

	return serialized;
};

export const listNotificationsForUser = async (userId) => {
	const notifications = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50);
	return notifications.map(serializeNotification);
};

export const markNotificationReadForUser = async ({ notificationId, userId }) => {
	const notification = await Notification.findOneAndUpdate(
		{ _id: notificationId, recipientId: userId, readAt: null },
		{ readAt: new Date() },
		{ new: true }
	);

	if (!notification) {
		const existing = await Notification.findOne({ _id: notificationId, recipientId: userId });
		return existing ? serializeNotification(existing) : null;
	}

	return serializeNotification(notification);
};

export const markAllNotificationsReadForUser = async (userId) => {
	await Notification.updateMany({ recipientId: userId, readAt: null }, { readAt: new Date() });
	return listNotificationsForUser(userId);
};
