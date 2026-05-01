import express from 'express';
import { getPendingSubmissions } from './submission.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isInstructorOrAdmin, isLearnerOrAdmin } from '../../middleware/role.middleware.js';
import { uploadAssignmentFile } from '../../middleware/upload.middleware.js';
import {
	gradeSubmissionController,
	getSubmissionController,
	getInstructorSubmissionsController,
	listSubmissionsByAssignmentController,
	submitAssignmentController,
	mySubmissionsController,
} from './submission.controller.js';

const router = express.Router();

router.post('/', authenticate, isLearnerOrAdmin, uploadAssignmentFile.single('file'), submitAssignmentController);
router.get('/me', authenticate, mySubmissionsController);
router.get('/instructor/feed', authenticate, isInstructorOrAdmin, getInstructorSubmissionsController);
router.get('/pending', authenticate, isInstructorOrAdmin, getPendingSubmissions);
router.get('/assignment/:assignmentId', authenticate, isInstructorOrAdmin, listSubmissionsByAssignmentController);
router.get('/:submissionId', authenticate, isInstructorOrAdmin, getSubmissionController);
router.patch('/:submissionId/grade', authenticate, isInstructorOrAdmin, gradeSubmissionController);

export default router;
