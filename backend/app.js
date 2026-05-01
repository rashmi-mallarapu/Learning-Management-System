 import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { env } from './config/env.js';

const app = express();
const defaultDevOrigins = ['http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://localhost:5174'];
const configuredOrigins = env.clientUrl === '*'
	? []
	: env.clientUrl
			.split(',')
			.map((origin) => origin.trim())
			.filter(Boolean);
const allowedOrigins = new Set([...defaultDevOrigins, ...configuredOrigins]);

app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' },
	crossOriginEmbedderPolicy: false,
}));
app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.has(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error(`CORS blocked for origin: ${origin}`));
		},
		credentials: true,
	})
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'LMS Backend is running',
		apiBase: '/api',
		health: '/api/health',
	});
});

// Serve uploaded files (videos, PDFs, thumbnails) with proper headers
app.use('/uploads', express.static('uploads', {
	setHeaders: (res, filePath) => {
		// Allow cross-origin access for all uploaded files
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Cross-Origin-Resource-Policy', 'cross-origin');
		// Enable range requests for video seeking
		if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
			res.set('Accept-Ranges', 'bytes');
		}
	}
}));
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
