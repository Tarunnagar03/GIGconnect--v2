import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

const InboxPage = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { auth } = useContext(AuthContext);
    const { onlineUsers } = useContext(SocketContext);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await api.get('/conversations');
                setConversations(res.data);
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
            } finally {
                setLoading(false);
            }
        };

        if (auth.isAuthenticated) {
            fetchConversations();
        }
    }, [auth.isAuthenticated]);

    if (loading) {
        return <div className="text-center mt-10">Loading your inbox...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Inbox</h1>
            <div className="bg-white rounded-lg shadow-md">
                {conversations.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {conversations.map(convo => {
                            const otherParticipant = convo.participants.find(p => p._id !== auth.user.id);
                            if (!otherParticipant) return null;

                            const isOnline = onlineUsers.includes(otherParticipant._id);
                            const lastMessageTimestamp = new Date(convo.updatedAt).toLocaleString([], {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            });

                            return (
                                <li key={convo._id}>
                                    <Link to={`/chat/${otherParticipant._id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <p className="font-bold text-lg text-gray-800">{otherParticipant.name}</p>
                                            </div>
                                            <p className="text-xs text-gray-400">{convo.lastMessage ? lastMessageTimestamp : ''}</p>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate mt-1 pl-6">
                                            {convo.lastMessage?.text || 'No messages yet'}
                                        </p>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="p-6 text-gray-500 text-center">You have no conversations yet.</p>
                )}
            </div>
        </div>
    );
};

export default InboxPage;