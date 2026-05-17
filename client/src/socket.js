// client/src/socket.js
import { io } from 'socket.io-client';

// The URL of your backend server
const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: false // We will connect manually when the user is logged in
});