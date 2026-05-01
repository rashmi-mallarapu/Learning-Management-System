import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['auth', 'system', 'mod', 'security', 'content'],
			required: true,
		},
		event: {
			type: String,
			required: true,
			trim: true,
		},
		user: {
			type: String,
			default: 'SYSTEM',
			trim: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		ip: {
			type: String,
			default: 'internal',
			trim: true,
		},
		severity: {
			type: String,
			enum: ['low', 'medium', 'high'],
			default: 'low',
		},
		meta: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

auditLogSchema.index({ type: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
