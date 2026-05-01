import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
	{
		quizId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Quiz',
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		answers: {
			type: [mongoose.Schema.Types.Mixed],
			required: true,
		},
		score: {
			type: Number,
			required: false,
			default: null,
			min: 0,
		},
		total: {
			type: Number,
			required: true,
			min: 0,
		},
		percentage: {
			type: Number,
			required: false,
			default: null,
			min: 0,
			max: 100,
		},
		passed: {
			type: Boolean,
			default: null,
		},
		status: {
			type: String,
			enum: ['pending', 'reviewed'],
			default: 'pending',
		},
		timeTaken: {
			type: Number,
			default: 0,
		},
		feedback: {
			type: String,
			default: '',
			trim: true,
		},
		reviewedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		reviewedAt: {
			type: Date,
			default: null,
		},
		completedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		versionKey: false,
	}
);

quizAttemptSchema.index({ quizId: 1, userId: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
