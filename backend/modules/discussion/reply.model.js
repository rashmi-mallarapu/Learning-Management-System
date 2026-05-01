import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
    {
        discussionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: [true, 'Reply content is required'],
            trim: true,
            minlength: [5, 'Content must be at least 5 characters'],
        },
        isBestAnswer: {
            type: Boolean,
            default: false,
            index: true,
        },
        upvotes: {
            type: Number,
            default: 0,
            min: 0,
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
replySchema.index({ discussionId: 1, createdAt: 1 });
replySchema.index({ discussionId: 1, isBestAnswer: -1, createdAt: 1 });
replySchema.index({ userId: 1, createdAt: -1 });

const Reply = mongoose.models.Reply || mongoose.model('Reply', replySchema);

export default Reply;
