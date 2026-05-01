import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
	{
		assignmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Assignment',
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		fileUrl: {
			type: String,
			required: true,
			trim: true,
		},
		grade: {
			type: Number,
			default: null,
			min: 0,
			max: 100,
		},
		feedback: {
			type: String,
			default: '',
			trim: true,
		},
		gradedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		gradedAt: {
			type: Date,
			default: null,
		},
	},
	{
		versionKey: false,
		timestamps: true,
	}
);

submissionSchema.index({ assignmentId: 1, userId: 1 }, { unique: true });

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default Submission;
