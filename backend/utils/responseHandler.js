export const successResponse = (res, { statusCode = 200, message = 'Success', data = null }) =>
	res.status(statusCode).json({
		success: true,
		message,
		data,
	});

export const paginatedResponse = (res, { message = 'Success', data = [], pagination = {}, statusCode = 200 }) =>
	res.status(statusCode).json({
		success: true,
		message,
		data,
		pagination,
	});
