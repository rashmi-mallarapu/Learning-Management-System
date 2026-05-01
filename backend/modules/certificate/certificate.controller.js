import { successResponse } from '../../utils/responseHandler.js';

import { issueCertificate, getCertificatesByUser, getCertificateById, verifyCertificate } from './certificate.service.js';

export const issueCertificateController = async (req, res, next) => {
	try {
		const certificate = await issueCertificate({
			userId: req.user._id,
			courseId: req.body.courseId,
		});
		return successResponse(res, {
			statusCode: 201,
			message: 'Certificate issued successfully',
			data: certificate,
		});
	} catch (error) {
		return next(error);
	}
};

export const myCertificatesController = async (req, res, next) => {
	try {
		const certificates = await getCertificatesByUser(req.user._id);
		return successResponse(res, {
			message: 'Certificates fetched successfully',
			data: certificates,
		});
	} catch (error) {
		return next(error);
	}
};

export const getCertificateController = async (req, res, next) => {
	try {
		const certificate = await getCertificateById(req.params.certId);
		return successResponse(res, {
			message: 'Certificate fetched successfully',
			data: certificate,
		});
	} catch (error) {
		return next(error);
	}
};

export const verifyCertificateController = async (req, res, next) => {
	try {
		const certificate = await verifyCertificate(req.params.certNumber);
		return successResponse(res, {
			message: 'Certificate verified successfully',
			data: certificate,
		});
	} catch (error) {
		return next(error);
	}
};
