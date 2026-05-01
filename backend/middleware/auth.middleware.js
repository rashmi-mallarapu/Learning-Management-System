import jwt from 'jsonwebtoken';

import User from '../modules/user/user.model.js';
import { env } from '../config/env.js';
import { createAppError } from '../utils/constants.js';

export const authenticate = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw createAppError('Authorization token is required', 401);
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, env.jwtSecret);
		const user = await User.findById(decoded.userId).select('-password');

		if (!user) {
			throw createAppError('Invalid token or user not found', 401);
		}

		req.user = user;
		next();
	} catch (error) {
		next(error);
	}
};
