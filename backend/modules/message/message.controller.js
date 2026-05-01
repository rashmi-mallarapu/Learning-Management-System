import { successResponse } from '../../utils/responseHandler.js';
import { emitToUser } from '../../config/socket.js';

import { sendMessage, getInbox, getSentMessages, getMessageById, markAsRead, deleteMessage, getUnreadCount } from './message.service.js';

export const sendMessageController = async (req, res, next) => {
	try {
		const message = await sendMessage({
			senderId: req.user._id,
			receiverId: req.body.receiverId,
			subject: req.body.subject,
			content: req.body.content,
		});

		emitToUser(req.body.receiverId, 'message:new', {
			message,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Message sent successfully',
			data: message,
		});
	} catch (error) {
		return next(error);
	}
};

export const getInboxController = async (req, res, next) => {
	try {
		const messages = await getInbox(req.user._id);
		return successResponse(res, {
			message: 'Inbox fetched successfully',
			data: messages,
		});
	} catch (error) {
		return next(error);
	}
};

export const getSentController = async (req, res, next) => {
	try {
		const messages = await getSentMessages(req.user._id);
		return successResponse(res, {
			message: 'Sent messages fetched successfully',
			data: messages,
		});
	} catch (error) {
		return next(error);
	}
};

export const getMessageController = async (req, res, next) => {
	try {
		const message = await getMessageById(req.params.messageId, req.user._id);
		return successResponse(res, {
			message: 'Message fetched successfully',
			data: message,
		});
	} catch (error) {
		return next(error);
	}
};

export const markAsReadController = async (req, res, next) => {
	try {
		await markAsRead(req.params.messageId, req.user._id);
		return successResponse(res, {
			message: 'Message marked as read',
		});
	} catch (error) {
		return next(error);
	}
};

export const deleteMessageController = async (req, res, next) => {
	try {
		await deleteMessage(req.params.messageId, req.user._id);
		return successResponse(res, {
			message: 'Message deleted successfully',
		});
	} catch (error) {
		return next(error);
	}
};

export const unreadCountController = async (req, res, next) => {
	try {
		const count = await getUnreadCount(req.user._id);
		return successResponse(res, {
			message: 'Unread count fetched',
			data: { unreadCount: count },
		});
	} catch (error) {
		return next(error);
	}
};
