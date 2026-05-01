import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Map userId -> Set of socket ids
const onlineUsers = new Map();
let ioRef = null;

export const emitToUser = (userId, eventName, payload = {}) => {
	if (!ioRef || !userId || !eventName) return false;
	const sockets = onlineUsers.get(String(userId));
	if (!sockets || sockets.size === 0) return false;

	sockets.forEach((socketId) => {
		ioRef.to(socketId).emit(eventName, payload);
	});

	return true;
};

export const emitToUsers = (userIds = [], eventName, payload = {}) => {
	if (!ioRef || !Array.isArray(userIds) || !eventName) return 0;

	let deliveredTo = 0;
	userIds.forEach((userId) => {
		if (emitToUser(userId, eventName, payload)) {
			deliveredTo += 1;
		}
	});

	return deliveredTo;
};

export const initSocketServer = (httpServer) => {
	const defaultDevOrigins = ['http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://localhost:5174'];
	const configuredOrigins = env.clientUrl === '*'
		? []
		: env.clientUrl
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean);
	const allowedOrigins = new Set([...defaultDevOrigins, ...configuredOrigins]);

	const io = new Server(httpServer, {
		cors: {
			origin(origin, callback) {
				if (!origin || allowedOrigins.has(origin)) {
					callback(null, true);
					return;
				}

				callback(new Error(`Socket CORS blocked for origin: ${origin}`));
			},
			credentials: true,
		},
	});

	ioRef = io;

	// Auth middleware — verify JWT before allowing connection
	io.use((socket, next) => {
		const token = socket.handshake.auth?.token;
		if (!token) {
			return next(new Error('Authentication required'));
		}
		try {
			const decoded = jwt.verify(token, env.jwtSecret);
			socket.userId = String(decoded.userId || decoded.id || decoded._id);
			socket.userName = decoded.name || 'User';
			next();
		} catch {
			next(new Error('Invalid token'));
		}
	});

	io.on('connection', (socket) => {
		const userId = socket.userId;
		console.log(`[Socket] User connected: ${userId} (socket: ${socket.id})`);

		// Track online users — one user can have multiple tabs
		if (!onlineUsers.has(userId)) {
			onlineUsers.set(userId, new Set());
		}
		onlineUsers.get(userId).add(socket.id);

		// Broadcast online status
		socket.broadcast.emit('user:online', { userId });
		
		// Send the current user the list of all online users
		socket.emit('users:online_list', Array.from(onlineUsers.keys()));

		// ─── Call Signaling ───

		// Caller initiates a call
		socket.on('call:initiate', ({ receiverId, channelName, isVideo, callerName }) => {
			const targetId = String(receiverId);
			console.log(`[Socket] Call from ${userId} to ${targetId} on channel ${channelName}`);
			const receiverSockets = onlineUsers.get(targetId);
			if (receiverSockets && receiverSockets.size > 0) {
				// Send ring to all tabs of the receiver
				receiverSockets.forEach((socketId) => {
					io.to(socketId).emit('call:incoming', {
						callerId: userId,
						callerName: callerName || socket.userName,
						channelName,
						isVideo,
					});
				});
			} else {
				// Receiver is offline
				socket.emit('call:unavailable', {
					receiverId,
					message: 'User is currently offline',
				});
			}
		});

		// Receiver accepts the call
		socket.on('call:accept', ({ callerId, channelName }) => {
			const targetId = String(callerId);
			console.log(`[Socket] Call accepted by ${userId} for channel ${channelName}`);
			const callerSockets = onlineUsers.get(targetId);
			if (callerSockets) {
				callerSockets.forEach((socketId) => {
					io.to(socketId).emit('call:accepted', {
						acceptedBy: userId,
						channelName,
					});
				});
			}
		});

		// Receiver rejects the call
		socket.on('call:reject', ({ callerId, channelName }) => {
			const targetId = String(callerId);
			console.log(`[Socket] Call rejected by ${userId} for channel ${channelName}`);
			const callerSockets = onlineUsers.get(targetId);
			if (callerSockets) {
				callerSockets.forEach((socketId) => {
					io.to(socketId).emit('call:rejected', {
						rejectedBy: userId,
						channelName,
					});
				});
			}
		});

		// Either party ends the call
		socket.on('call:end', ({ otherUserId, channelName }) => {
			const targetId = String(otherUserId);
			console.log(`[Socket] Call ended by ${userId} on channel ${channelName}`);
			const otherSockets = onlineUsers.get(targetId);
			if (otherSockets) {
				otherSockets.forEach((socketId) => {
					io.to(socketId).emit('call:ended', {
						endedBy: userId,
						channelName,
					});
				});
			}
		});

		// ─── Disconnect ───
		socket.on('disconnect', () => {
			console.log(`[Socket] User disconnected: ${userId} (socket: ${socket.id})`);
			const userSockets = onlineUsers.get(userId);
			if (userSockets) {
				userSockets.delete(socket.id);
				if (userSockets.size === 0) {
					onlineUsers.delete(userId);
					socket.broadcast.emit('user:offline', { userId });
				}
			}
		});
	});

	return io;
};
export const getIORef = () => ioRef;