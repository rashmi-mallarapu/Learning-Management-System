import { env } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
	const error = new Error(`Route not found: ${req.originalUrl}`);
	error.statusCode = 404;
	next(error);
};

export const errorHandler = (err, req, res, next) => {
	const statusCode = err.statusCode || 500;

	if (err.name === 'CastError') {
		return res.status(400).json({
			success: false,
			message: 'Invalid resource identifier',
		});
	}

	if (err.code === 11000) {
		return res.status(409).json({
			success: false,
			message: 'Duplicate record found',
			details: err.keyValue,
		});
	}

	return res.status(statusCode).json({
		success: false,
		message: err.message || 'Internal server error',
		...(env.nodeEnv !== 'production' ? { stack: err.stack } : {}),
	});
};
