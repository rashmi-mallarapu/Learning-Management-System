import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import {
	listMyNotificationsController,
	markAllNotificationsReadController,
	markNotificationReadController,
} from './notification.controller.js';

const router = express.Router();

router.get('/me', authenticate, listMyNotificationsController);
router.patch('/me/read-all', authenticate, markAllNotificationsReadController);
router.patch('/:notificationId/read', authenticate, markNotificationReadController);

export default router;
