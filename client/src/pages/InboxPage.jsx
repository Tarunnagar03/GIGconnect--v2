/**
 * InboxPage Component
 * UPDATED: May 6, 2026 - Messaging System Enhancement
 * 
 * Features:
 * - Conversation list display
 * - Real-time message updates via Socket.IO
 * - User presence indicators
 * - Message history management
 * - Modern messaging interface
 * - Responsive design for mobile
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatPreviewText } from '../utils/moderationEngine';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const InboxPage = () => {
    const { auth } = useAuth();
    const { onlineUsers, socket } = useSocket();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: conversations = [], isLoading: loading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await api.get('/conversations');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    // Re-fetch inbox when a new message updates a conversation
    useEffect(() => {
        if (!socket || !auth.isAuthenticated) return;
        const handler = () => {
            // Tell React Query the cached conversations are stale, triggering an automatic background refetch
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };
        socket.on('conversationUpdated', handler);
        return () => socket.off('conversationUpdated', handler);
    }, [socket, auth.isAuthenticated, queryClient]);

    const handleProfileClick = (e, participant) => {
        e.preventDefault(); // Prevents the outer <Link> from triggering
        e.stopPropagation();
        if (participant.role === 'Client') {
            navigate(`/client-profile/${participant._id}`);
        } else {
            navigate(`/profile/${participant._id}`);
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading your inbox...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Messages</h1>
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {conversations.length > 0 ? (
                    <div className="flex flex-col">
                        {conversations.map(convo => {
                        const currentUserId = auth?.user?.id || auth?.user?._id;
                        const otherParticipant = convo.participants.find(p => String(p._id) !== String(currentUserId));
                            if (!otherParticipant) return null;

                            const isOnline = Array.isArray(onlineUsers) && onlineUsers.includes(String(otherParticipant._id));
                            const lastMessageTimestamp = new Date(convo.updatedAt).toLocaleString([], {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            });

                            return (
                                <Link key={convo._id} to={`/chat/${otherParticipant._id}`} className="block p-4 md:p-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="relative cursor-pointer group" 
                                                    onClick={(e) => handleProfileClick(e, otherParticipant)}
                                                    title="View Profile"
                                                >
                                                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl group-hover:shadow-md transition-all">
                                                        {(otherParticipant.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                </div>
                                                <div>
                                                    <p 
                                                        className="font-bold text-lg text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors inline-block"
                                                        onClick={(e) => handleProfileClick(e, otherParticipant)}
                                                        title="View Profile"
                                                    >
                                                        {otherParticipant.name || 'Unknown User'}
                                                    </p>
                                                    <p className={`text-sm truncate w-48 sm:w-64 md:w-96 ${convo.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                        {convo.lastMessage ? formatPreviewText(convo.lastMessage.text) : 'No messages yet'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                <p className={`text-xs ${convo.unreadCount > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{convo.lastMessage ? lastMessageTimestamp : ''}</p>
                                                {convo.unreadCount > 0 && (
                                                    <div className="bg-blue-600 text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
                                                        {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        </div>
                        <p className="text-gray-500 text-lg">You have no conversations yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxPage;