import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { createCommunicationController, listCommunicationsByCourseController } from './communication.controller.js';

const router = express.Router();

router.post('/', authenticate, createCommunicationController);
router.get('/course/:courseId', authenticate, listCommunicationsByCourseController);

export default router;
