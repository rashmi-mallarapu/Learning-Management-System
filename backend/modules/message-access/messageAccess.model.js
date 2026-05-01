import mongoose from 'mongoose';

const messageAccessRequestSchema = new mongoose.Schema(
	{
		learnerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		instructorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		status: {
			type: String,
			enum: ['pending', 'approved', 'rejected'],
			default: 'pending',
		},
		note: {
			type: String,
			trim: true,
			default: '',
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
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		versionKey: false,
	}
);

messageAccessRequestSchema.index({ learnerId: 1, instructorId: 1 }, { unique: true });

const MessageAccessRequest = mongoose.model('MessageAccessRequest', messageAccessRequestSchema);

export default MessageAccessRequest;