import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
	{
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
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		courseId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Course',
			default: null,
		},
		audience: {
			type: String,
			enum: ['all', 'course', 'learners', 'instructors'],
			default: 'all',
		},
		pinned: {
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

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
