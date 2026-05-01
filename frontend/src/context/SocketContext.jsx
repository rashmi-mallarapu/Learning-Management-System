import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
    const { token } = useSelector(s => s.auth);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Create socket connection with auth token
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['polling', 'websocket'], // polling first for handshake, then upgrades to WS
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            if (reason !== 'io client disconnect') {
                console.log('[Socket] Disconnected:', reason);
            }
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        newSocket.on('users:online_list', (usersArray) => {
            setOnlineUsers(new Set(usersArray.map(String)));
        });

        newSocket.on('user:online', ({ userId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.add(String(userId));
                return next;
            });
        });

        newSocket.on('user:offline', ({ userId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(String(userId));
                return next;
            });
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
