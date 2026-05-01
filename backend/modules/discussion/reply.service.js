import Reply from './reply.model.js';
import Discussion from './discussion.model.js';

class ReplyService {
    async createReply({ discussionId, userId, content }) {
        // Validate discussionId exists
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            throw new Error('Discussion not found');
        }

        const reply = new Reply({
            discussionId,
            userId,
            content: String(content || '').trim(),
        });

        await reply.validate();
        return reply.save();
    }

    async getRepliesByDiscussion(discussionId) {
        return Reply.find({ discussionId })
            .populate('userId', 'name avatar email role')
            .sort({ isBestAnswer: -1, createdAt: 1 })
            .lean();
    }

    async getReplyById(replyId) {
        return Reply.findById(replyId)
            .populate('userId', 'name avatar email role')
            .lean();
    }

    async upvoteReply(replyId) {
        return Reply.findByIdAndUpdate(
            replyId,
            { $inc: { upvotes: 1 } },
            { new: true }
        );
    }

    async markBestAnswer({ replyId, discussionId, userId, userRole }) {
        const reply = await Reply.findById(replyId);
        if (!reply) {
            throw new Error('Reply not found');
        }

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            throw new Error('Discussion not found');
        }

        // Only the discussion creator or instructor can mark best answer
        const isDiscussionOwner = String(discussion.userId) === String(userId);
        const isInstructor = userRole === 'instructor' || userRole === 'admin';

        if (!isDiscussionOwner && !isInstructor) {
            throw new Error('Only the discussion creator or instructor can mark best answer');
        }

        // If another reply was marked best, unmark it
        if (reply.isBestAnswer === false) {
            await Reply.updateMany(
                { discussionId, isBestAnswer: true },
                { isBestAnswer: false }
            );
        }

        reply.isBestAnswer = !reply.isBestAnswer;
        return reply.save();
    }

    async deleteReply(replyId, userId) {
        const reply = await Reply.findById(replyId);
        if (!reply) {
            throw new Error('Reply not found');
        }

        // Only the reply creator can delete it
        if (String(reply.userId) !== String(userId)) {
            throw new Error('Only the reply creator can delete it');
        }

        return Reply.findByIdAndDelete(replyId);
    }
}

export default new ReplyService();
