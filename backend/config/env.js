import dotenv from 'dotenv';

dotenv.config();

const requiredVariables = ['MONGODB_URI', 'JWT_SECRET'];

requiredVariables.forEach((variable) => {
	if (!process.env[variable]) {
		throw new Error(`Missing required environment variable: ${variable}`);
	}
});

export const env = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT) || 5000,
	mongoUri: process.env.MONGODB_URI,
	jwtSecret: process.env.JWT_SECRET,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
	bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
	clientUrl: process.env.CLIENT_URL || '*',
	googleClassroomClientEmail: process.env.GOOGLE_CLASSROOM_CLIENT_EMAIL || '',
	googleClassroomPrivateKey: (process.env.GOOGLE_CLASSROOM_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
	googleClassroomDelegatedUser: process.env.GOOGLE_CLASSROOM_DELEGATED_USER || '',
	adminRegistrationToken: process.env.ADMIN_REGISTRATION_TOKEN || '',
};
