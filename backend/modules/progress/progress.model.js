import mongoose from 'mongoose';

const progressModelSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		courseId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Course',
			required: true,
		},
		completionPercentage: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
			default: 0,
		},
		completedLessons: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Lesson',
			},
		],
	},
	{
		versionKey: false,
	}
);

progressModelSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const ProgressModel = mongoose.model('Progress', progressModelSchema);

export default ProgressModel;
