import User from './auth.model.js';

import { env } from '../../config/env.js';
import { ROLES, createAppError } from '../../utils/constants.js';
import generateToken from '../../utils/generateToken.js';
import { comparePassword, hashPassword } from '../../utils/hashPassword.js';
import { logEvent } from '../auditLog/auditLog.service.js';

const allowedRegisterRoles = [ROLES.INSTRUCTOR, ROLES.LEARNER];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const buildAuthPayload = (user) => {
	const token = generateToken({ userId: user._id, role: user.role });

	return {
		token,
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			avatar: user.avatar || '',
			bio: user.bio || '',
			focus: user.focus || '',
			timezone: user.timezone || '',
			role: user.role,
			createdAt: user.createdAt,
		},
	};
};

export const registerAdmin = async ({ name, email, password, adminToken }) => {
	// Validate admin registration token from environment
	if (!env.adminRegistrationToken) {
		throw createAppError('Admin registration is not enabled on this server', 503);
	}

	if (adminToken !== env.adminRegistrationToken) {
		throw createAppError('Invalid or missing admin registration token', 401);
	}

	const normalizedEmail = normalizeEmail(email);
	const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

	if (existingUser && existingUser.isEmailVerified) {
		throw createAppError('User already exists with this email', 409);
	}

	const hashedPassword = await hashPassword(password);

	let user;
	if (existingUser) {
		existingUser.name = name;
		existingUser.email = normalizedEmail;
		existingUser.password = hashedPassword;
		existingUser.role = ROLES.ADMIN;
		existingUser.isEmailVerified = true;
		user = await existingUser.save();
	} else {
		user = await User.create({
			name,
			email: normalizedEmail,
			password: hashedPassword,
			role: ROLES.ADMIN,
			isEmailVerified: true,
		});
	}

	return buildAuthPayload(user);
};

export const registerUser = async ({ name, email, password, role, _ip = 'unknown' }) => {
	if (!allowedRegisterRoles.includes(role)) {
		throw createAppError('Role must be either instructor or learner', 400);
	}

	const normalizedEmail = normalizeEmail(email);
	const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

	if (existingUser) {
		throw createAppError('User already exists with this email', 409);
	}

	const hashedPassword = await hashPassword(password);

	const user = await User.create({
		name,
		email: normalizedEmail,
		password: hashedPassword,
		role,
		isEmailVerified: true,
	});

	await logEvent({
		type: 'auth',
		event: `New ${role} account registered`,
		user: name,
		userId: user._id,
		ip: _ip,
		severity: 'low',
	});

	return buildAuthPayload(user);
};

export const loginUser = async ({ email, password, _ip = 'unknown' }) => {
	const normalizedEmail = normalizeEmail(email);
	const user = await User.findOne({ email: normalizedEmail }).select('+password');

	if (!user || !user.password) {
		await logEvent({
			type: 'auth',
			event: 'Failed login attempt — user not found',
			user: normalizedEmail,
			ip: _ip,
			severity: 'medium',
		});
		throw createAppError('Invalid email or password', 401);
	}

	const isPasswordValid = await comparePassword(password, user.password);
	if (!isPasswordValid) {
		await logEvent({
			type: 'auth',
			event: 'Failed login attempt — wrong password',
			user: user.name,
			userId: user._id,
			ip: _ip,
			severity: 'medium',
		});
		throw createAppError('Invalid email or password', 401);
	}

	await logEvent({
		type: 'auth',
		event: `User logged in successfully`,
		user: user.name,
		userId: user._id,
		ip: _ip,
		severity: 'low',
	});

	return buildAuthPayload(user);
};
