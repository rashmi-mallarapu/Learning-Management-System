import mongoose from 'mongoose';

import { LESSON_TYPES } from '../../utils/constants.js';

const lessonSchema = new mongoose.Schema(
	{
		courseId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Course',
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		contentUrl: {
			type: String,
			required: true,
			trim: true,
		},
		type: {
			type: String,
			enum: [LESSON_TYPES.VIDEO, LESSON_TYPES.PDF],
			required: true,
		},
		duration: {
			type: String,
			default: '',
		},
		order: {
			type: Number,
			default: 0,
		},
		description: {
			type: String,
			default: '',
		},
	},
	{
		versionKey: false,
	}
);

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
