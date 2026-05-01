import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isInstructorOrAdmin, isLearnerOrAdmin } from '../../middleware/role.middleware.js';
import {
	approveAccessRequestController,
	checkApprovedAccessController,
	getInstructorAccessRequestsController,
	getMessageAccessStatusController,
	rejectAccessRequestController,
	requestMessageAccessController,
} from './messageAccess.controller.js';

const router = express.Router();

router.post('/request', authenticate, isLearnerOrAdmin, requestMessageAccessController);
router.get('/status/:instructorId', authenticate, getMessageAccessStatusController);
router.get('/check/:instructorId', authenticate, checkApprovedAccessController);
router.get('/instructor/me', authenticate, isInstructorOrAdmin, getInstructorAccessRequestsController);
router.patch('/:requestId/approve', authenticate, isInstructorOrAdmin, approveAccessRequestController);
router.patch('/:requestId/reject', authenticate, isInstructorOrAdmin, rejectAccessRequestController);

export default router;