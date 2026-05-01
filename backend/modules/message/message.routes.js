import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import {
	sendMessageController,
	getInboxController,
	getSentController,
	getMessageController,
	markAsReadController,
	deleteMessageController,
	unreadCountController,
} from './message.controller.js';

const router = express.Router();

router.post('/', authenticate, sendMessageController);
router.get('/inbox', authenticate, getInboxController);
router.get('/sent', authenticate, getSentController);
router.get('/unread-count', authenticate, unreadCountController);
router.get('/:messageId', authenticate, getMessageController);
router.patch('/:messageId/read', authenticate, markAsReadController);
router.delete('/:messageId', authenticate, deleteMessageController);

export default router;
