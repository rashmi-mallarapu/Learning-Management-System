import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isInstructorOrAdmin } from '../../middleware/role.middleware.js';
import {
	createAnnouncementController,
	listAnnouncementsController,
	getAnnouncementController,
	deleteAnnouncementController,
} from './announcement.controller.js';

const router = express.Router();

router.post('/', authenticate, isInstructorOrAdmin, createAnnouncementController);
router.get('/', authenticate, listAnnouncementsController);
router.get('/:announcementId', authenticate, getAnnouncementController);
router.delete('/:announcementId', authenticate, isInstructorOrAdmin, deleteAnnouncementController);

export default router;
