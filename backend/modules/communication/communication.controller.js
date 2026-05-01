import { successResponse } from '../../utils/responseHandler.js';

import { createCommunication, getCommunicationsByCourse } from './communication.service.js';

export const createCommunicationController = async (req, res, next) => {
	try {
		const communication = await createCommunication({
			courseId: req.body.courseId,
			senderId: req.user._id,
			senderRole: req.user.role,
			type: req.body.type,
			content: req.body.content,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Communication posted successfully',
			data: communication,
		});
	} catch (error) {
		return next(error);
	}
};

export const listCommunicationsByCourseController = async (req, res, next) => {
	try {
		const messages = await getCommunicationsByCourse(req.params.courseId);
		return successResponse(res, {
			message: 'Communications fetched successfully',
			data: messages,
		});
	} catch (error) {
		return next(error);
	}
};
