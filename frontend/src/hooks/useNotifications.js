import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationApi';

const formatRelativeTime = (value) => {
	if (!value) return 'Just now';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Just now';

	const diffMs = Date.now() - date.getTime();
	const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

	if (diffMinutes < 1) return 'Just now';
	if (diffMinutes < 60) return `${diffMinutes}m ago`;

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString();
};

const mapNotification = (notification) => ({
	...notification,
	id: notification.id || notification._id,
	unread: !notification.read,
	time: formatRelativeTime(notification.createdAt),
});

export const useNotifications = () => {
	const [notifications, setNotifications] = useState([]);
	const { socket } = useSocket();

	useEffect(() => {
		let mounted = true;

		fetchMyNotifications()
			.then((data) => {
				if (!mounted) return;
				setNotifications(Array.isArray(data) ? data.map(mapNotification) : []);
			})
			.catch(() => {
				if (mounted) setNotifications([]);
			});

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (!socket) return undefined;

		const handleNotification = (payload) => {
			const nextItem = mapNotification(payload);
			setNotifications((prev) => {
				if (prev.some((item) => String(item.id) === String(nextItem.id))) {
					return prev;
				}

				return [nextItem, ...prev];
			});

			toast.success(nextItem.title);
		};

		socket.on('notification:new', handleNotification);
		return () => {
			socket.off('notification:new', handleNotification);
		};
	}, [socket]);

	const handleMarkRead = async (notificationId) => {
		const updated = await markNotificationRead(notificationId);
		setNotifications((prev) =>
			prev.map((item) => (String(item.id) === String(notificationId) ? mapNotification(updated) : item))
		);
	};

	const handleMarkAllRead = async () => {
		const updated = await markAllNotificationsRead();
		setNotifications(Array.isArray(updated) ? updated.map(mapNotification) : []);
	};

	return {
		notifications,
		handleMarkRead,
		handleMarkAllRead,
		setNotifications,
	};
};
