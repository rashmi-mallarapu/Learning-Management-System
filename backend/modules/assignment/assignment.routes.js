import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { isInstructorOrAdmin, isLearnerOrAdmin } from '../../middleware/role.middleware.js';
import { createAssignmentController, listAssignmentsByCourseController, getAssignmentController, myAssignmentsController } from './assignment.controller.js';

const router = express.Router();

router.post('/', authenticate, isInstructorOrAdmin, createAssignmentController);
router.get('/me', authenticate, myAssignmentsController);
router.get('/course/:courseId', authenticate, listAssignmentsByCourseController);
router.get('/:assignmentId', authenticate, getAssignmentController);

export default router;
