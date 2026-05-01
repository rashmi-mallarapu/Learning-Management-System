import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isLearnerOrAdmin } from '../../middleware/role.middleware.js';
import { getMyProgressController, updateProgressController } from './progress.controller.js';

const router = express.Router();

router.put('/', authenticate, isLearnerOrAdmin, updateProgressController);
router.get('/me', authenticate, getMyProgressController);

export default router;
