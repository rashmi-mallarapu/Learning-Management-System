import mongoose from 'mongoose';

import Lesson from '../lesson/lesson.model.js';
import Note from './note.model.js';

import { createAppError } from '../../utils/constants.js';

const assertValidObjectId = (value, fieldName) => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		throw createAppError(`Invalid ${fieldName}`, 400);
	}
};

export const createNote = async ({ userId, lessonId, content, timestamp }) => {
	assertValidObjectId(lessonId, 'lessonId');

	const lesson = await Lesson.findById(lessonId).select('_id');
	if (!lesson) {
		throw createAppError('Lesson not found', 404);
	}

	const normalizedContent = String(content || '').trim();
	if (!normalizedContent) {
		throw createAppError('Note content is required', 400);
	}

	let normalizedTimestamp = null;
	if (timestamp !== undefined && timestamp !== null && timestamp !== '') {
		const numericTimestamp = Number(timestamp);
		if (!Number.isFinite(numericTimestamp) || numericTimestamp < 0) {
			throw createAppError('timestamp must be a non-negative number', 400);
		}
		normalizedTimestamp = numericTimestamp;
	}

	return Note.create({
		userId,
		lessonId,
		content: normalizedContent,
		timestamp: normalizedTimestamp,
	});
};

export const getNotesByLesson = async ({ userId, lessonId }) => {
	assertValidObjectId(lessonId, 'lessonId');

	return Note.find({ userId, lessonId })
		.sort({ timestamp: 1, createdAt: 1 })
		.select('-userId');
};

export const deleteNote = async ({ userId, noteId }) => {
	assertValidObjectId(noteId, 'noteId');

	const deleted = await Note.findOneAndDelete({ _id: noteId, userId });
	if (!deleted) {
		throw createAppError('Note not found', 404);
	}

	return deleted;
};
