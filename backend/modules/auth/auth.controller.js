import { successResponse } from '../../utils/responseHandler.js';

import {
	loginUser,
	registerAdmin,
	registerUser,
} from './auth.service.js';

export const register = async (req, res, next) => {
	try {
		const data = await registerUser({ ...req.body, _ip: req.ip || 'unknown' });
		return successResponse(res, {
			statusCode: 201,
			message: 'User registered successfully',
			data,
		});
	} catch (error) {
		return next(error);
	}
};

export const registerAdminController = async (req, res, next) => {
	try {
		const data = await registerAdmin(req.body);
		return successResponse(res, {
			statusCode: 201,
			message: 'Admin registered successfully',
			data,
		});
	} catch (error) {
		return next(error);
	}
};

export const login = async (req, res, next) => {
	try {
		const data = await loginUser({ ...req.body, _ip: req.ip || 'unknown' });
		return successResponse(res, {
			statusCode: 200,
			message: 'Login successful',
			data,
		});
	} catch (error) {
		return next(error);
	}
};
