import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const ChatPage = () => {
    const { recipientId } = useParams();
    const { socket } = useContext(SocketContext);
    const { auth } = useContext(AuthContext);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomName, setRoomName] = useState('');
    const [recipientName, setRecipientName] = useState('...'); // Default to loading state
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // This effect handles auto-scrolling to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // This single, robust useEffect handles all setup for the chat room
    useEffect(() => {
        // Wait until all necessary data is available
        if (!auth.user || !recipientId || !socket) {
            return;
        }

        // 1. Create a consistent, unique room name for the two users
        const sortedIds = [auth.user.id, recipientId].sort();
        const newRoomName = sortedIds.join('-');
        setRoomName(newRoomName);
        
        // 2. Tell the server to join this specific room
        socket.emit('joinRoom', newRoomName);
        console.log(`[ChatPage] User ${auth.user.name} attempting to join room: ${newRoomName}`);

        // 3. Set up the event listener for incoming messages
        const onReceiveMessage = (messageData) => {
            console.log('[ChatPage] Received message from server:', messageData); // For debugging
            setMessages(prevMessages => [...prevMessages, messageData]);
        };
        socket.on('receiveMessage', onReceiveMessage);

        // 4. Fetch the chat history and the other user's name
        const fetchData = async () => {
            setLoading(true);
            try {
                const [recipientRes, messagesRes] = await Promise.all([
                    api.get(`/messages/user/${recipientId}`),
                    api.get(`/messages/${newRoomName}`)
                ]);
                setRecipientName(recipientRes.data.name);
                setMessages(messagesRes.data);
            } catch (error) {
                console.error("Failed to load chat data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // 5. IMPORTANT: Cleanup function to remove the listener when leaving the page
        return () => {
            console.log(`[ChatPage] Leaving room: ${newRoomName}`);
            socket.off('receiveMessage', onReceiveMessage);
        };

    }, [auth.user, recipientId, socket]); // This hook re-runs if the user or chat partner changes

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && roomName && socket) {
            const messageData = {
                senderId: auth.user.id,
                senderName: auth.user.name,
                text: newMessage,
                timestamp: new Date().toISOString()
            };
            socket.emit('sendMessage', { roomName, messageData });
            setNewMessage('');
        }
    };
    
    if (loading) {
        return <div className="text-center mt-20">Loading Chat...</div>;
    }

    return (
        <div className="flex flex-col h-[80vh] max-w-2xl mx-auto border rounded-lg shadow-md bg-white">
            <div className="bg-gray-100 p-4 border-b">
                <Link to="/inbox" className="text-sm text-blue-600 hover:underline mb-2 block">&larr; Back to Inbox</Link>
                <h1 className="text-xl font-bold">Chat with {recipientName}</h1>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.length === 0 && !loading && (
                    <div className="text-center text-gray-500">
                        No messages yet. Start the conversation!
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-4 flex ${msg.senderName === auth.user.name ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.senderName === auth.user.name ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="font-bold text-sm">{msg.senderName}</p>
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.senderName === auth.user.name ? 'text-blue-200' : 'text-gray-500'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 text-white px-6 rounded-r-md hover:bg-blue-700">Send</button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;