import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { createNoteController, deleteNoteController, getNotesByLessonController } from './note.controller.js';

const router = express.Router();

router.post('/', authenticate, createNoteController);
router.get('/:lessonId', authenticate, getNotesByLessonController);
router.delete('/:id', authenticate, deleteNoteController);

export default router;
