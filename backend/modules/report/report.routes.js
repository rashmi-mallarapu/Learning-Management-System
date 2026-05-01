import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/role.middleware.js';
import {
	createReportController,
	getReportController,
	listReportsController,
	updateReportStatusController,
} from './report.controller.js';

const router = express.Router();

router.post('/', authenticate, createReportController);
router.get('/', authenticate, listReportsController);
router.get('/:reportId', authenticate, getReportController);
router.patch('/:reportId/status', authenticate, isAdmin, updateReportStatusController);

export default router;
