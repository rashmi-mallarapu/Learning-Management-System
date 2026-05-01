import { ROLES, createAppError } from '../utils/constants.js';

const authorize = (...allowedRoles) => (req, res, next) => {
	if (!req.user) {
		return next(createAppError('Unauthorized access', 401));
	}

	if (!allowedRoles.includes(req.user.role)) {
		return next(createAppError('Forbidden: insufficient permissions', 403));
	}

	return next();
};

export const isInstructor = authorize(ROLES.INSTRUCTOR);
export const isLearner = authorize(ROLES.LEARNER);
export const isAdmin = authorize(ROLES.ADMIN);
export const isInstructorOrAdmin = authorize(ROLES.INSTRUCTOR, ROLES.ADMIN);
export const isLearnerOrAdmin = authorize(ROLES.LEARNER, ROLES.ADMIN);
