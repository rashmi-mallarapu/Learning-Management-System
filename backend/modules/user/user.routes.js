import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { uploadAvatar } from '../../middleware/upload.middleware.js';
import { isAdmin } from '../../middleware/role.middleware.js';
import {
	changeUserRole,
	getMyProfile,
	getUser,
	listUsers,
	updateMyAvatarController,
	updateMyPasswordController,
	updateMyProfileController,
} from './user.controller.js';

const router = express.Router();

router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfileController);
router.patch('/me/avatar', authenticate, uploadAvatar.single('avatar'), updateMyAvatarController);
router.patch('/me/password', authenticate, updateMyPasswordController);
router.get('/', authenticate, isAdmin, listUsers);
router.get('/:userId', authenticate, isAdmin, getUser);
router.patch('/:userId/role', authenticate, isAdmin, changeUserRole);

export default router;
