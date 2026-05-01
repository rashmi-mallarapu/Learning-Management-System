import mongoose from 'mongoose';

import { ROLES } from '../../utils/constants.js';

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		avatar: {
			type: String,
			trim: true,
			default: '',
		},
		bio: {
			type: String,
			trim: true,
			default: '',
		},
		focus: {
			type: String,
			trim: true,
			default: '',
		},
		timezone: {
			type: String,
			trim: true,
			default: '',
		},
		password: {
			type: String,
			required: false,
			select: false,
		},
		role: {
			type: String,
			enum: [ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.LEARNER],
			required: true,
			default: ROLES.LEARNER,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		versionKey: false,
	}
);

const User = mongoose.model('User', userSchema);

export default User;
