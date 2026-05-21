/**
 * SocketContext - Real-time Communication Management
 * UPDATED: May 6, 2026 - Socket.IO Integration
 * 
 * Manages:
 * - Socket.IO connection state
 * - Real-time message updates
 * - User presence tracking
 * - Conversation notifications
 * - Live event handling
 * 
 * Features:
 * - Automatic reconnection handling
 * - Message event listeners
 * - Connection status monitoring
 * - Chat room management
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Enterprise Best Practice: Custom Hook to consume Context (Fixes Vite HMR Warning)
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { auth } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]); // State to hold online users

    useEffect(() => {
        if (auth.isAuthenticated) {
            // Attach JWT for server-side socket auth
            socket.auth = { token: localStorage.getItem('token') };

            // Manually connect the socket when the user is authenticated
            socket.connect();

            // When connected, tell the server who this user is
            socket.on('connect', () => {
                // Server will derive userId from socket JWT; keep event for compatibility
                socket.emit('addUser');
            });

            // Listen for the updated list of online users from the server
            socket.on('getOnlineUsers', (users) => {
                setOnlineUsers(users);
            });

            // Cleanup function to disconnect and remove listeners
            return () => {
                socket.off('connect');
                socket.off('getOnlineUsers');
                socket.disconnect();
            };
        }
    }, [auth.isAuthenticated, auth.user?.id]);

    // Make the socket instance and the list of online users available to the whole app
    const value = { socket, onlineUsers };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};