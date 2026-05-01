import fs from 'fs';
import path from 'path';

import multer from 'multer';

import { createAppError } from '../utils/constants.js';

const ensureDir = (directory) => {
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}
};

const storage = (folder) =>
	multer.diskStorage({
		destination: (req, file, cb) => {
			const uploadPath = path.join('uploads', folder);
			ensureDir(uploadPath);
			cb(null, uploadPath);
		},
		filename: (req, file, cb) => {
			const extension = path.extname(file.originalname);
			const baseName = path.basename(file.originalname, extension).replace(/\s+/g, '-').toLowerCase();
			cb(null, `${Date.now()}-${baseName}${extension}`);
		},
	});

const createUploader = ({ folder, allowedMimeTypes }) =>
	multer({
		storage: storage(folder),
		limits: { fileSize: 20 * 1024 * 1024 },
		fileFilter: (req, file, cb) => {
			if (!allowedMimeTypes.includes(file.mimetype)) {
				return cb(createAppError('Unsupported file type', 400));
			}
			return cb(null, true);
		},
	});

export const uploadCourseContent = createUploader({
	folder: 'courses',
	allowedMimeTypes: [
		'video/mp4',
		'video/webm',
		'video/ogg',
		'video/quicktime',
		'application/pdf',
		'application/x-pdf',
	],
});

export const uploadAssignmentFile = createUploader({
	folder: 'submissions',
	allowedMimeTypes: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'image/png',
		'image/jpeg',
	],
});

export const uploadThumbnail = createUploader({
	folder: 'thumbnails',
	allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
});

export const uploadAvatar = createUploader({
	folder: 'avatars',
	allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
});
