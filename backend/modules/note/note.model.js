import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		lessonId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Lesson',
			required: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		timestamp: {
			type: Number,
			default: null,
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

noteSchema.index({ userId: 1, lessonId: 1, timestamp: 1, createdAt: 1 });

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);

export default Note;
