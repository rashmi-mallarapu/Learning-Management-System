import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		category: {
			type: String,
			enum: ['Technical', 'Content', 'Account', 'Billing', 'Security', 'Other'],
			default: 'Technical',
		},
		status: {
			type: String,
			enum: ['open', 'in_review', 'resolved', 'closed'],
			default: 'open',
		},
		priority: {
			type: String,
			enum: ['low', 'normal', 'high'],
			default: 'normal',
		},
		reportedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		reportedByRole: {
			type: String,
			enum: ['admin', 'instructor', 'learner'],
			required: true,
		},
		adminNote: {
			type: String,
			trim: true,
			default: '',
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

reportSchema.index({ reportedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1, category: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
