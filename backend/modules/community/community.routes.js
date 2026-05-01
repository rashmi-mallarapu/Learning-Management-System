import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import {
	createDiscussionController,
	listDiscussionsController,
	getDiscussionController,
	addReplyController,
	toggleLikeController,
	deleteDiscussionController,
} from './community.controller.js';

const router = express.Router();

router.post('/', authenticate, createDiscussionController);
router.get('/', authenticate, listDiscussionsController);
router.get('/:discussionId', authenticate, getDiscussionController);
router.post('/:discussionId/reply', authenticate, addReplyController);
router.post('/:discussionId/like', authenticate, toggleLikeController);
router.delete('/:discussionId', authenticate, deleteDiscussionController);

export default router;
