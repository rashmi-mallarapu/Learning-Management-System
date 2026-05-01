import mongoose from 'mongoose';

import { COMMUNICATION_TYPES } from '../../utils/constants.js';

const communicationSchema = new mongoose.Schema(
	{
		courseId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Course',
			required: true,
		},
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		type: {
			type: String,
			enum: [COMMUNICATION_TYPES.ANNOUNCEMENT, COMMUNICATION_TYPES.MESSAGE],
			default: COMMUNICATION_TYPES.MESSAGE,
			required: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
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

const Communication = mongoose.model('Communication', communicationSchema);

export default Communication;
