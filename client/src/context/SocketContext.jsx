import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { auth } = useContext(AuthContext);
    const [onlineUsers, setOnlineUsers] = useState([]); // State to hold online users

    useEffect(() => {
        if (auth.isAuthenticated) {
            // Manually connect the socket when the user is authenticated
            socket.connect();

            // When connected, tell the server who this user is
            socket.on('connect', () => {
                socket.emit('addUser', auth.user.id);
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
    }, [auth]);

    // Make the socket instance and the list of online users available to the whole app
    const value = { socket, onlineUsers };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};