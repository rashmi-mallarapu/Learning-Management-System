import discussionService from './discussion.service.js';
import replyService from './reply.service.js';
import { successResponse } from '../../utils/responseHandler.js';

export const createDiscussion = async (req, res) => {
    try {
        const { lessonId, title, content, tags } = req.body;
        const userId = req.user._id;

        if (!lessonId || !title || !content) {
            return res.status(400).json({ error: 'lessonId, title, and content are required' });
        }

        const discussion = await discussionService.createDiscussion({
            lessonId,
            userId,
            title,
            content,
            tags,
        });

        return successResponse(res, {
            statusCode: 201,
            message: 'Discussion created successfully',
            data: discussion,
        });
    } catch (error) {
        console.error('Create discussion error:', error);
        res.status(400).json({ error: error.message || 'Failed to create discussion' });
    }
};

export const getDiscussionsByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { sortBy } = req.query;

        if (!lessonId) {
            return res.status(400).json({ error: 'lessonId is required' });
        }

        const discussions = await discussionService.getDiscussionsByLesson(lessonId, sortBy);

        return successResponse(res, {
            message: 'Discussions fetched successfully',
            data: discussions,
        });
    } catch (error) {
        console.error('Get discussions error:', error);
        res.status(400).json({ error: error.message || 'Failed to fetch discussions' });
    }
};

export const getDiscussionById = async (req, res) => {
    try {
        const { id } = req.params;

        const discussion = await discussionService.getDiscussionById(id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        return successResponse(res, {
            message: 'Discussion fetched successfully',
            data: discussion,
        });
    } catch (error) {
        console.error('Get discussion error:', error);
        res.status(400).json({ error: error.message || 'Failed to fetch discussion' });
    }
};

export const upvoteDiscussion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Discussion id is required' });
        }

        const discussion = await discussionService.upvoteDiscussion(id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        return successResponse(res, {
            message: 'Discussion upvoted successfully',
            data: discussion,
        });
    } catch (error) {
        console.error('Upvote discussion error:', error);
        res.status(400).json({ error: error.message || 'Failed to upvote discussion' });
    }
};

export const resolveDiscussion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!id) {
            return res.status(400).json({ error: 'Discussion id is required' });
        }

        const discussion = await discussionService.resolveDiscussion(id, userId);

        return successResponse(res, {
            message: 'Discussion resolved successfully',
            data: discussion,
        });
    } catch (error) {
        console.error('Resolve discussion error:', error);
        res.status(400).json({ error: error.message || 'Failed to resolve discussion' });
    }
};

export const deleteDiscussion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!id) {
            return res.status(400).json({ error: 'Discussion id is required' });
        }

        await discussionService.deleteDiscussion(id, userId);

        return successResponse(res, {
            message: 'Discussion deleted successfully',
            data: null,
        });
    } catch (error) {
        console.error('Delete discussion error:', error);
        res.status(400).json({ error: error.message || 'Failed to delete discussion' });
    }
};

export const createReply = async (req, res) => {
    try {
        const { discussionId, content } = req.body;
        const userId = req.user._id;

        if (!discussionId || !content) {
            return res.status(400).json({ error: 'discussionId and content are required' });
        }

        const reply = await replyService.createReply({
            discussionId,
            userId,
            content,
        });

        return successResponse(res, {
            statusCode: 201,
            message: 'Reply created successfully',
            data: reply,
        });
    } catch (error) {
        console.error('Create reply error:', error);
        res.status(400).json({ error: error.message || 'Failed to create reply' });
    }
};

export const getRepliesByDiscussion = async (req, res) => {
    try {
        const { discussionId } = req.params;

        if (!discussionId) {
            return res.status(400).json({ error: 'discussionId is required' });
        }

        const replies = await replyService.getRepliesByDiscussion(discussionId);

        return successResponse(res, {
            message: 'Replies fetched successfully',
            data: replies,
        });
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(400).json({ error: error.message || 'Failed to fetch replies' });
    }
};

export const upvoteReply = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Reply id is required' });
        }

        const reply = await replyService.upvoteReply(id);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        return successResponse(res, {
            message: 'Reply upvoted successfully',
            data: reply,
        });
    } catch (error) {
        console.error('Upvote reply error:', error);
        res.status(400).json({ error: error.message || 'Failed to upvote reply' });
    }
};

export const markBestAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { discussionId } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        if (!id || !discussionId) {
            return res.status(400).json({ error: 'id and discussionId are required' });
        }

        const reply = await replyService.markBestAnswer({
            replyId: id,
            discussionId,
            userId,
            userRole,
        });

        return successResponse(res, {
            message: 'Best answer marked successfully',
            data: reply,
        });
    } catch (error) {
        console.error('Mark best answer error:', error);
        res.status(400).json({ error: error.message || 'Failed to mark best answer' });
    }
};

export const deleteReply = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!id) {
            return res.status(400).json({ error: 'Reply id is required' });
        }

        await replyService.deleteReply(id, userId);

        return successResponse(res, {
            message: 'Reply deleted successfully',
            data: null,
        });
    } catch (error) {
        console.error('Delete reply error:', error);
        res.status(400).json({ error: error.message || 'Failed to delete reply' });
    }
};
