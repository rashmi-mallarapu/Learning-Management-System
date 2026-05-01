import Course from '../course/course.model.js';
import Communication from './communication.model.js';

import { COMMUNICATION_TYPES, ROLES, createAppError } from '../../utils/constants.js';

export const createCommunication = async ({ courseId, senderId, senderRole, type, content }) => {
	const course = await Course.findById(courseId);
	if (!course) {
		throw createAppError('Course not found', 404);
	}

	if (type === COMMUNICATION_TYPES.ANNOUNCEMENT && ![ROLES.INSTRUCTOR, ROLES.ADMIN].includes(senderRole)) {
		throw createAppError('Only instructor or admin can post announcements', 403);
	}

	return Communication.create({
		courseId,
		senderId,
		type,
		content,
	});
};

export const getCommunicationsByCourse = async (courseId) =>
	Communication.find({ courseId })
		.populate('senderId', 'name email role')
		.sort({ createdAt: -1 });
