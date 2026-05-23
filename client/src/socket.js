// client/src/socket.js
import { io } from 'socket.io-client';

// The URL of your backend server
const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: false, // We will connect manually when the user is logged in
    transports: ['websocket'], // CRITICAL FIX: Bypasses long-polling to prevent PM2 cluster mode crashes
    withCredentials: true // SECURE: Ensure HttpOnly cookies are sent during Socket.IO handshake
});