import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
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
	{ _id: true, versionKey: false }
);

const discussionSchema = new mongoose.Schema(
	{
		courseId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Course',
			default: null,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		category: {
			type: String,
			enum: ['general', 'help', 'showcase', 'feedback', 'study-group'],
			default: 'general',
		},
		tags: {
			type: [String],
			default: [],
		},
		replies: {
			type: [replySchema],
			default: [],
		},
		likes: {
			type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
			default: [],
		},
		views: {
			type: Number,
			default: 0,
		},
		isPinned: {
			type: Boolean,
			default: false,
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

const Discussion = mongoose.model('Discussion', discussionSchema);

export default Discussion;
