import { JWT } from 'google-auth-library';
import { env } from '../../config/env.js';
import { createAppError } from '../../utils/constants.js';

const GOOGLE_CLASSROOM_SCOPE = 'https://www.googleapis.com/auth/classroom.courses';

const ensureGoogleClassroomConfig = () => {
	if (!env.googleClassroomClientEmail || !env.googleClassroomPrivateKey || !env.googleClassroomDelegatedUser) {
		throw createAppError(
			'Google Classroom is not configured. Set GOOGLE_CLASSROOM_CLIENT_EMAIL, GOOGLE_CLASSROOM_PRIVATE_KEY, and GOOGLE_CLASSROOM_DELEGATED_USER.',
			500
		);
	}
};

const getGoogleClassroomClient = () => {
	ensureGoogleClassroomConfig();

	return new JWT({
		email: env.googleClassroomClientEmail,
		key: env.googleClassroomPrivateKey,
		scopes: [GOOGLE_CLASSROOM_SCOPE],
		subject: env.googleClassroomDelegatedUser,
	});
};

export const createGoogleClassroomCourse = async ({ title, description, section }) => {
	const client = getGoogleClassroomClient();
	const { token } = await client.getAccessToken();

	if (!token) {
		throw createAppError('Failed to obtain Google Classroom access token', 500);
	}

	const response = await fetch('https://classroom.googleapis.com/v1/courses', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			name: title,
			section: section || 'LMS Course',
			descriptionHeading: title,
			description: description?.slice(0, 1000) || '',
			ownerId: 'me',
			courseState: 'ACTIVE',
		}),
	});

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const errorMessage = data?.error?.message || data?.message || 'Failed to create Google Classroom course';
		throw createAppError(errorMessage, response.status || 500);
	}

	return {
		id: data.id || '',
		name: data.name || title,
		section: data.section || section || '',
		descriptionHeading: data.descriptionHeading || title,
		description: data.description || description || '',
		enrollmentCode: data.enrollmentCode || '',
		alternateLink: data.alternateLink || '',
		state: data.courseState || 'ACTIVE',
		createdAt: new Date(),
	};
};
