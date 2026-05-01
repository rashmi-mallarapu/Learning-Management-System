import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/role.middleware.js';
import {
	listAuditLogsController,
	getAuditLogStatsController,
	clearAuditLogsController,
	logCallEndController,
} from './auditLog.controller.js';

const router = express.Router();

// All audit log routes are admin-only
router.get('/', authenticate, isAdmin, listAuditLogsController);
router.get('/stats', authenticate, isAdmin, getAuditLogStatsController);
router.delete('/', authenticate, isAdmin, clearAuditLogsController);

// Any authenticated user can report a call-end event
router.post('/call-end', authenticate, logCallEndController);

export default router;
