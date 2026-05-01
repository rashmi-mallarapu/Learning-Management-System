import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['multiple_choice', 'true_false', 'descriptive', 'survey'],
			default: 'multiple_choice',
		},
		question: {
			type: String,
			required: true,
			trim: true,
		},
		options: {
			type: [String],
			default: [],
			validate: {
				validator: function validateOptions(value) {
					if (this.type === 'descriptive' || this.type === 'survey') {
						return true;
					}
					return Array.isArray(value) && value.filter(Boolean).length >= 2;
				},
				message: 'Multiple choice and true/false questions must have at least two options',
			},
		},
		correctAnswer: {
			type: String,
			required: function requiredCorrectAnswer() {
				return this.type !== 'survey';
			},
			trim: true,
			default: '',
		},
		points: {
			type: Number,
			default: 1,
			min: 1,
		},
		explanation: {
			type: String,
			default: '',
			trim: true,
		},
	},
	{ _id: false }
);

const quizSchema = new mongoose.Schema(
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
		questions: {
			type: [quizQuestionSchema],
			required: true,
			validate: {
				validator: (value) => Array.isArray(value) && value.length > 0,
				message: 'Quiz must include at least one question',
			},
		},
		timeLimit: {
			type: Number,
			default: 30,
			min: 1,
		},
		passingScore: {
			type: Number,
			default: 70,
			min: 0,
			max: 100,
		},
		lessonOrder: {
			type: Number,
			default: null,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
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

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
