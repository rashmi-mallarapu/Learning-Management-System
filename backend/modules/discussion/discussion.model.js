import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema(
    {
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Discussion title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters'],
            maxlength: [200, 'Title must not exceed 200 characters'],
        },
        content: {
            type: String,
            required: [true, 'Discussion content is required'],
            trim: true,
            minlength: [10, 'Content must be at least 10 characters'],
        },
        tags: {
            type: [String],
            default: [],
            enum: ['React', 'Node', 'Bug', 'Feature', 'Question', 'Documentation', 'Other'],
        },
        upvotes: {
            type: Number,
            default: 0,
            min: 0,
        },
        isResolved: {
            type: Boolean,
            default: false,
            index: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true }
);

// Compound indexes for common queries
discussionSchema.index({ lessonId: 1, createdAt: -1 });
discussionSchema.index({ lessonId: 1, upvotes: -1 });
discussionSchema.index({ userId: 1, createdAt: -1 });

const Discussion = mongoose.models.Discussion || mongoose.model('Discussion', discussionSchema);

export default Discussion;
