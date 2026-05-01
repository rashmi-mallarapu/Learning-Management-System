import express from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import {
	issueCertificateController,
	myCertificatesController,
	getCertificateController,
	verifyCertificateController,
} from './certificate.controller.js';

const router = express.Router();

router.post('/', authenticate, issueCertificateController);
router.get('/me', authenticate, myCertificatesController);
router.get('/verify/:certNumber', verifyCertificateController);
router.get('/:certId', authenticate, getCertificateController);

export default router;
