import { createServer } from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { env } from './config/env.js';
import { initSocketServer } from './config/socket.js';

const startHttpServer = (initialPort) => {
	const maxRetries = 10;

	const listenOnPort = (port, attemptsLeft) => {
		const httpServer = createServer(app);

		// Attach Socket.IO to the HTTP server
		const io = initSocketServer(httpServer);
		app.set('io', io); // Make io available in routes if needed

		httpServer
			.listen(port, () => {
				// eslint-disable-next-line no-console
				console.log(`Server running in ${env.nodeEnv} mode on port ${port}`);
				console.log(`Socket.IO is ready for real-time connections`);
			})
			.on('error', (error) => {
				if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
					// eslint-disable-next-line no-console
					console.warn(`Port ${port} is in use. Retrying on port ${port + 1}...`);
					listenOnPort(port + 1, attemptsLeft - 1);
					return;
				}

				// eslint-disable-next-line no-console
				console.error('Server startup failed:', error.message);
				process.exit(1);
			});

		return httpServer;
	};

	listenOnPort(initialPort, maxRetries);
};

const startServer = async () => {
	try {
		await connectDB();
		startHttpServer(env.port);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Server startup failed:', error.message);
		process.exit(1);
	}
};

startServer();
