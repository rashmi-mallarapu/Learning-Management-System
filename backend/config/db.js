import mongoose from 'mongoose';

import { env } from './env.js';

const connectDB = async () => {
	try {
		await mongoose.connect(env.mongoUri, {
			serverSelectionTimeoutMS: 10000,
			maxPoolSize: 20,
		});
		// eslint-disable-next-line no-console
		console.log('MongoDB connected successfully');
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('MongoDB connection failed:', error.message);
		throw error;
	}
};

export default connectDB;
