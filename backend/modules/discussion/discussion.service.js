import Discussion from './discussion.model.js';
import Reply from './reply.model.js';
import Lesson from '../lesson/lesson.model.js';

class DiscussionService {
    async createDiscussion({ lessonId, userId, title, content, tags }) {
        // Validate lessonId exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // Validate and sanitize tags
        const validTags = ['React', 'Node', 'Bug', 'Feature', 'Question', 'Documentation', 'Other'];
        const filteredTags = tags
            ? tags.filter(tag => validTags.includes(tag))
            : [];

        const discussion = new Discussion({
            lessonId,
            userId,
            title: String(title || '').trim(),
            content: String(content || '').trim(),
            tags: filteredTags,
        });

        await discussion.validate();
        return discussion.save();
    }

    async getDiscussionsByLesson(lessonId, sortBy = 'latest') {
        const sortOptions = sortBy === 'latest' ? { createdAt: -1 } : { upvotes: -1, createdAt: -1 };

        const discussions = await Discussion.find({ lessonId })
            .populate('userId', 'name avatar email')
            .sort(sortOptions)
            .lean();

        // Add reply counts to each discussion
        const discussionsWithCounts = await Promise.all(
            discussions.map(async (discussion) => {
                const replyCount = await Reply.countDocuments({ discussionId: discussion._id });
                return { ...discussion, replyCount };
            })
        );

        return discussionsWithCounts;
    }

    async getDiscussionById(discussionId) {
        return Discussion.findById(discussionId)
            .populate('userId', 'name avatar email')
            .lean();
    }

    async upvoteDiscussion(discussionId) {
        return Discussion.findByIdAndUpdate(
            discussionId,
            { $inc: { upvotes: 1 } },
            { new: true }
        );
    }

    async resolveDiscussion(discussionId, userId) {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            throw new Error('Discussion not found');
        }

        // Only the discussion creator can mark it as resolved
        if (String(discussion.userId) !== String(userId)) {
            throw new Error('Only the discussion creator can mark it as resolved');
        }

        discussion.isResolved = !discussion.isResolved;
        return discussion.save();
    }

    async deleteDiscussion(discussionId, userId) {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            throw new Error('Discussion not found');
        }

        // Only the discussion creator can delete it
        if (String(discussion.userId) !== String(userId)) {
            throw new Error('Only the discussion creator can delete it');
        }

        return Discussion.findByIdAndDelete(discussionId);
    }
}

export default new DiscussionService();
