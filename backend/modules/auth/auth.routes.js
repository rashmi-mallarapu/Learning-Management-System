import express from 'express';

import { login, register, registerAdminController } from './auth.controller.js';
import {
	adminRegistrationValidation,
	loginValidation,
	registerValidation,
	validateRequest,
} from './auth.validation.js';

const router = express.Router();

router.get('/', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Auth API is active',
		endpoints: {
			register: 'POST /api/auth/register',
			registerAdmin: 'POST /api/auth/register-admin (requires adminToken)',
			login: 'POST /api/auth/login',
		},
	});
});

router.get('/register', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Use POST /api/register or POST /api/auth/register to register',
	});
});

router.get('/login', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Use POST /api/login or POST /api/auth/login to authenticate',
	});
});

router.post('/register', registerValidation, validateRequest, register);
router.post('/register-admin', adminRegistrationValidation, validateRequest, registerAdminController);
router.post('/login', loginValidation, validateRequest, login);

export default router;
