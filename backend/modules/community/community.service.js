import Discussion from './discussion.model.js';

import { createAppError } from '../../utils/constants.js';

export const createDiscussion = async ({ userId, courseId, title, content, category, tags }) =>
	Discussion.create({ userId, courseId, title, content, category, tags });

export const getDiscussions = async (query = {}) => {
	const filter = {};

	if (query.courseId) {
		filter.courseId = query.courseId;
	}
	if (query.category && query.category !== 'all') {
		filter.category = query.category;
	}
	if (query.search) {
		filter.$or = [
			{ title: { $regex: query.search, $options: 'i' } },
			{ content: { $regex: query.search, $options: 'i' } },
		];
	}

	return Discussion.find(filter)
		.populate('userId', 'name email role')
		.populate('replies.userId', 'name email role')
		.sort({ isPinned: -1, createdAt: -1 });
};

export const getDiscussionById = async (discussionId) => {
	const discussion = await Discussion.findByIdAndUpdate(
		discussionId,
		{ $inc: { views: 1 } },
		{ new: true }
	)
		.populate('userId', 'name email role')
		.populate('replies.userId', 'name email role');

	if (!discussion) {
		throw createAppError('Discussion not found', 404);
	}

	return discussion;
};

export const addReply = async ({ discussionId, userId, content }) => {
	const discussion = await Discussion.findById(discussionId);
	if (!discussion) {
		throw createAppError('Discussion not found', 404);
	}

	discussion.replies.push({ userId, content });
	await discussion.save();

	const updated = await Discussion.findById(discussionId)
		.populate('userId', 'name email role')
		.populate('replies.userId', 'name email role');

	return updated;
};

export const toggleLike = async ({ discussionId, userId }) => {
	const discussion = await Discussion.findById(discussionId);
	if (!discussion) {
		throw createAppError('Discussion not found', 404);
	}

	const index = discussion.likes.indexOf(userId);
	if (index === -1) {
		discussion.likes.push(userId);
	} else {
		discussion.likes.splice(index, 1);
	}

	await discussion.save();

	return {
		liked: index === -1,
		likeCount: discussion.likes.length,
	};
};

export const deleteDiscussion = async (discussionId, userId) => {
	const discussion = await Discussion.findById(discussionId);
	if (!discussion) {
		throw createAppError('Discussion not found', 404);
	}
	if (discussion.userId.toString() !== userId.toString()) {
		throw createAppError('Not authorized to delete this discussion', 403);
	}
	await Discussion.findByIdAndDelete(discussionId);
	return discussion;
};
