import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
    createDiscussion,
    getDiscussionsByLesson,
    getDiscussionById,
    upvoteDiscussion,
    resolveDiscussion,
    deleteDiscussion,
    createReply,
    getRepliesByDiscussion,
    upvoteReply,
    markBestAnswer,
    deleteReply,
} from './discussion.controller.js';

const router = express.Router();

// Discussion routes
router.post('/', authenticate, createDiscussion);
router.get('/lesson/:lessonId', getDiscussionsByLesson);
router.get('/:id', getDiscussionById);
router.put('/:id/upvote', authenticate, upvoteDiscussion);
router.put('/:id/resolve', authenticate, resolveDiscussion);
router.delete('/:id', authenticate, deleteDiscussion);

// Reply routes
router.post('/reply/create', authenticate, createReply);
router.get('/reply/:discussionId', getRepliesByDiscussion);
router.put('/reply/:id/upvote', authenticate, upvoteReply);
router.put('/reply/:id/best', authenticate, markBestAnswer);
router.delete('/reply/:id', authenticate, deleteReply);

export default router;
