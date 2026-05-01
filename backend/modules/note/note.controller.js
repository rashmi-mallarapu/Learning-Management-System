import { successResponse } from '../../utils/responseHandler.js';

import { createNote, deleteNote, getNotesByLesson } from './note.service.js';

export const createNoteController = async (req, res, next) => {
	try {
		const note = await createNote({
			userId: req.user._id,
			lessonId: req.body.lessonId,
			content: req.body.content,
			timestamp: req.body.timestamp,
		});

		return successResponse(res, {
			statusCode: 201,
			message: 'Note created successfully',
			data: note,
		});
	} catch (error) {
		return next(error);
	}
};

export const getNotesByLessonController = async (req, res, next) => {
	try {
		const notes = await getNotesByLesson({
			userId: req.user._id,
			lessonId: req.params.lessonId,
		});

		return successResponse(res, {
			message: 'Notes fetched successfully',
			data: notes,
		});
	} catch (error) {
		return next(error);
	}
};

export const deleteNoteController = async (req, res, next) => {
	try {
		await deleteNote({
			userId: req.user._id,
			noteId: req.params.id,
		});

		return successResponse(res, {
			message: 'Note deleted successfully',
		});
	} catch (error) {
		return next(error);
	}
};
