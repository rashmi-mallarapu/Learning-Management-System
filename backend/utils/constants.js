export const ROLES = Object.freeze({
	ADMIN: 'admin',
	INSTRUCTOR: 'instructor',
	LEARNER: 'learner',
});

export const LESSON_TYPES = Object.freeze({
	VIDEO: 'video',
	PDF: 'pdf',
});

export const COMMUNICATION_TYPES = Object.freeze({
	ANNOUNCEMENT: 'announcement',
	MESSAGE: 'message',
});

export const createAppError = (message, statusCode = 500) => {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
};
