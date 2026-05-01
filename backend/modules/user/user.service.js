import User from './user.model.js';

import { createAppError } from '../../utils/constants.js';
import { logEvent } from '../auditLog/auditLog.service.js';
import { comparePassword, hashPassword } from '../../utils/hashPassword.js';

export const getAllUsers = async (filters = {}) => {
	const query = {};

	if (filters.role) {
		query.role = filters.role;
	}

	if (filters.search) {
		query.$or = [
			{ name: { $regex: filters.search, $options: 'i' } },
			{ email: { $regex: filters.search, $options: 'i' } },
		];
	}

	return User.find(query).select('-password').sort({ createdAt: -1 });
};

export const getUserById = async (userId) => {
	const user = await User.findById(userId).select('-password');
	if (!user) {
		throw createAppError('User not found', 404);
	}
	return user;
};

export const updateUserRole = async ({ userId, role, actorName = 'admin' }) => {
	const updated = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true }).select(
		'-password'
	);

	if (!updated) {
		throw createAppError('User not found', 404);
	}

	await logEvent({
		type: 'security',
		event: `User role changed — "${updated.name}" is now ${role}`,
		user: actorName,
		userId: updated._id,
		severity: 'high',
		meta: { targetUserId: userId, newRole: role },
	});

	return updated;
};

export const updateMyProfile = async ({ userId, name, email, bio, focus, timezone }) => {
	const user = await User.findById(userId);

	if (!user) {
		throw createAppError('User not found', 404);
	}

	if (email && String(email).trim().toLowerCase() !== user.email) {
		const existingUser = await User.findOne({
			email: String(email).trim().toLowerCase(),
			_id: { $ne: userId },
		});

		if (existingUser) {
			throw createAppError('Email is already in use by another account', 409);
		}
	}

	user.name = String(name || user.name).trim();
	user.email = String(email || user.email).trim().toLowerCase();
	user.bio = String(bio || '').trim();
	user.focus = String(focus || '').trim();
	user.timezone = String(timezone || '').trim();
	await user.save();

	return User.findById(userId).select('-password');
};

export const updateMyAvatar = async ({ userId, avatarPath }) => {
	const user = await User.findByIdAndUpdate(
		userId,
		{ avatar: avatarPath },
		{ new: true, runValidators: true }
	).select('-password');

	if (!user) {
		throw createAppError('User not found', 404);
	}

	return user;
};

export const updateMyPassword = async ({ userId, currentPassword, newPassword }) => {
	const user = await User.findById(userId).select('+password');

	if (!user) {
		throw createAppError('User not found', 404);
	}

	if (user.role !== 'admin') {
		throw createAppError('Use the reset password email link to change your password', 403);
	}

	if (!user.password) {
		throw createAppError('Password login is not configured for this account', 400);
	}

	const matches = await comparePassword(currentPassword, user.password);
	if (!matches) {
		throw createAppError('Current password is incorrect', 400);
	}

	user.password = await hashPassword(newPassword);
	await user.save();

	await logEvent({
		type: 'security',
		event: 'Admin password updated',
		user: user.name,
		userId: user._id,
		severity: 'medium',
	});

	return { updated: true };
};
