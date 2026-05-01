import { successResponse } from '../../utils/responseHandler.js';
import { createAppError } from '../../utils/constants.js';

import { getAllUsers, getUserById, updateMyAvatar, updateMyPassword, updateMyProfile, updateUserRole } from './user.service.js';

export const listUsers = async (req, res, next) => {
	try {
		const users = await getAllUsers({
			role: req.query.role,
			search: req.query.search,
		});
		return successResponse(res, {
			message: 'Users fetched successfully',
			data: users,
		});
	} catch (error) {
		return next(error);
	}
};

export const getUser = async (req, res, next) => {
	try {
		const user = await getUserById(req.params.userId);
		return successResponse(res, {
			message: 'User fetched successfully',
			data: user,
		});
	} catch (error) {
		return next(error);
	}
};

export const changeUserRole = async (req, res, next) => {
	try {
		const updatedUser = await updateUserRole({
			userId: req.params.userId,
			role: req.body.role,
			actorName: req.user?.name || 'admin',
		});
		return successResponse(res, {
			message: 'User role updated successfully',
			data: updatedUser,
		});
	} catch (error) {
		return next(error);
	}
};

export const getMyProfile = async (req, res, next) => {
	try {
		const user = await getUserById(req.user._id);
		return successResponse(res, {
			message: 'Profile fetched successfully',
			data: user,
		});
	} catch (error) {
		return next(error);
	}
};

export const updateMyProfileController = async (req, res, next) => {
	try {
		const user = await updateMyProfile({
			userId: req.user._id,
			name: req.body.name,
			email: req.body.email,
			bio: req.body.bio,
			focus: req.body.focus,
			timezone: req.body.timezone,
		});
		return successResponse(res, {
			message: 'Profile updated successfully',
			data: user,
		});
	} catch (error) {
		return next(error);
	}
};

export const updateMyAvatarController = async (req, res, next) => {
	try {
		if (!req.file) {
			return next(createAppError('Avatar image is required', 400));
		}

		const avatarPath = `/uploads/avatars/${req.file.filename}`;
		const user = await updateMyAvatar({
			userId: req.user._id,
			avatarPath,
		});

		return successResponse(res, {
			message: 'Profile photo updated successfully',
			data: user,
		});
	} catch (error) {
		return next(error);
	}
};

export const updateMyPasswordController = async (req, res, next) => {
	try {
		const result = await updateMyPassword({
			userId: req.user._id,
			currentPassword: req.body.currentPassword,
			newPassword: req.body.newPassword,
		});

		return successResponse(res, {
			message: 'Password updated successfully',
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};
