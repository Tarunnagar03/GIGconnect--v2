import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { moderateHtmlText, checkMessageViolations } from '../utils/moderationEngine';
import ErrorBoundary from '../components/ErrorBoundary';

const renderMessageText = (text) => <span dangerouslySetInnerHTML={{ __html: moderateHtmlText(text) }} />;

const ChatPage = () => {
    const { recipientId } = useParams();
    const { socket } = useSocket();
    const { auth } = useContext(AuthContext);
    const location = useLocation();
    const serviceQuery = new URLSearchParams(location.search).get('service');
    const greetingQuery = new URLSearchParams(location.search).get('greeting');

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [recipientName, setRecipientName] = useState('...'); // Default to loading state
    const [recipientRole, setRecipientRole] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [offerDetails, setOfferDetails] = useState({ amount: '', time: '', description: '' });
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const actionsRef = useRef(null);

    // Close actions menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // This effect handles auto-scrolling to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-fill message if coming from a specific service card on the profile
    useEffect(() => {
        if (serviceQuery) {
            setNewMessage(`Hi! I saw your profile and I'm interested in your "${serviceQuery}" service. Can we discuss some details?`);
        } else if (greetingQuery) {
            setNewMessage(`Hi! I came across your profile and would love to connect and discuss a potential project.`);
        }
    }, [serviceQuery, greetingQuery]);

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

        // 3. Set up the event listener for incoming messages
        const onReceiveMessage = (messageData) => {
            if (String(messageData.senderId) === String(recipientId)) {
                socket.emit('markAsRead', { roomName: newRoomName, userId: auth.user.id });
            }
            setMessages(prevMessages => [...prevMessages, messageData]);
        };
        socket.on('receiveMessage', onReceiveMessage);

        // 3.5 Listen for typing events
        const onTyping = (data) => { if (data.senderId === recipientId) setIsTyping(true); };
        const onStopTyping = (data) => { if (data.senderId === recipientId) setIsTyping(false); };
        socket.on('typing', onTyping);
        socket.on('stopTyping', onStopTyping);

        // 3.6 Listen for Read Receipts (Blue Ticks)
        const onMessagesRead = ({ byUserId }) => {
            if (String(byUserId) === String(recipientId)) {
                setMessages(prev => prev.map(m => String(m.senderId || m.sender?._id || m.sender) === String(auth.user.id) ? { ...m, status: 'read' } : m));
            }
        };
        socket.on('messagesRead', onMessagesRead);
        
        // Notify other user that we opened the chat and read the messages
        socket.emit('markAsRead', { roomName: newRoomName, userId: auth.user.id });

        // 4. Fetch the chat history and the other user's name
        const fetchData = async () => {
            setLoading(true);
            try {
                const recipientRes = await api.get(`/messages/user/${recipientId}`);
                const messagesRes = await api.get(`/messages/${newRoomName}`).catch(err => { console.error(err); return { data: [] }; });
                setRecipientName(recipientRes.data?.name || 'Unknown User');
                setRecipientRole(recipientRes.data?.role || '');
                setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
            } catch (error) {
                console.error("Failed to load chat data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // 5. IMPORTANT: Cleanup function to remove the listener when leaving the page
        return () => {
            socket.off('receiveMessage', onReceiveMessage);
            socket.off('typing', onTyping);
            socket.off('stopTyping', onStopTyping);
            socket.off('messagesRead', onMessagesRead);
        };

    }, [auth.user, recipientId, socket]); // This hook re-runs if the user or chat partner changes

    const handleSendMessage = (e) => {
        e.preventDefault();

        const violation = checkMessageViolations(newMessage);
        if (violation.action === 'BLOCK') {
            alert(violation.msg);
            return;
        }
        if (violation.action === 'WARN' && !window.confirm(violation.msg)) return;

        if ((newMessage.trim() || attachment) && roomName && socket) {
            
            // 1. Send attachment if it exists using Data Serialization
            if (attachment) {
                const attachString = `[ATTACHMENT]:::${JSON.stringify(attachment)}`;
                const messageDataAttach = {
                    senderId: auth.user.id, senderName: auth.user.name,
                    text: attachString, timestamp: new Date().toISOString(),
                    status: 'delivered'
                };
                socket.emit('sendMessage', { roomName, messageData: messageDataAttach });
            }

            // 2. Send text message if it exists
            if (newMessage.trim()) {
                const messageDataText = {
                    senderId: auth.user.id, senderName: auth.user.name,
                    text: newMessage, timestamp: new Date().toISOString(),
                    status: 'delivered'
                };
                socket.emit('sendMessage', { roomName, messageData: messageDataText });
            }

            setNewMessage('');
            setAttachment(null);
            socket.emit('stopTyping', { roomName, senderId: auth.user.id });
        }
    };
    
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (socket && roomName) {
            socket.emit('typing', { roomName, senderId: auth.user.id });
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { roomName, senderId: auth.user.id });
            }, 2000);
        }
    };

    // --- VOICE RECORDING ENGINE ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current);
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const audioString = `[AUDIO]:::${JSON.stringify({ content: reader.result })}`;
                    socket.emit('sendMessage', {
                        roomName,
                        messageData: { senderId: auth.user.id, senderName: auth.user.name, text: audioString, timestamp: new Date().toISOString(), status: 'delivered' }
                    });
                };
                stream.getTracks().forEach(track => track.stop());
                clearInterval(recordingIntervalRef.current);
                setRecordingDuration(0);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            recordingIntervalRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
        } catch (err) { alert("Microphone access denied or unavailable."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                clearInterval(recordingIntervalRef.current);
                setRecordingDuration(0);
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendOffer = (e) => {
        e.preventDefault();
        if (offerDetails.amount && offerDetails.time && roomName && socket) {
            const offerString = `[CUSTOM_OFFER]:::${JSON.stringify(offerDetails)}`;
            const messageData = {
                senderId: auth.user.id,
                senderName: auth.user.name,
                text: offerString,
                timestamp: new Date().toISOString()
            };
            socket.emit('sendMessage', { roomName, messageData });
            setIsOfferModalOpen(false);
            setOfferDetails({ amount: '', time: '', description: '' });
        }
    };

    const handleStartInterview = () => {
        setShowActions(false);
        const meetingLink = `https://meet.jit.si/GigConnect-${roomName}-${Date.now()}`;
        const meetingData = { link: meetingLink, title: 'Video Interview' };
        const meetString = `[MEETING]:::${JSON.stringify(meetingData)}`;
        const messageData = {
            senderId: auth.user.id, senderName: auth.user.name,
            text: meetString, timestamp: new Date().toISOString(), status: 'delivered'
        };
        socket.emit('sendMessage', { roomName, messageData });
    };

    if (loading) {
        return <div className="text-center mt-20">Loading Chat...</div>;
    }

    return (
        <div className="flex flex-col h-[85vh] max-w-4xl mx-auto border border-gray-200 rounded-3xl shadow-2xl bg-gray-50 overflow-hidden animate-fade-in">
            {/* Clean White Sticky Header */}
            <ErrorBoundary componentName="Chat Header">
                <div className="bg-white/95 backdrop-blur-md p-4 border-b border-gray-200 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                    <Link to="/inbox" className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to={recipientRole === 'Client' ? `/client-profile/${recipientId}` : `/profile/${recipientId}`} className="flex items-center gap-3 group" title="View Profile">
                            <div className="w-11 h-11 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                                {(recipientName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{recipientName}</h1>
                                {recipientRole && <p className="text-xs text-gray-500 font-medium leading-none mt-0.5">{recipientRole}</p>}
                            </div>
                        </Link>
                    </div>
                </div>
            </ErrorBoundary>

            {/* Chat Area */}
            <ErrorBoundary componentName="Message History">
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#e5e5f7]/30">
                    {messages.length === 0 && !loading && (
                        <div className="flex justify-center mt-10">
                            <div className="text-center text-gray-500 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
                                <p className="font-semibold text-gray-700">No messages yet.</p>
                                <p className="text-sm mt-1">Start the conversation with {recipientName}!</p>
                            </div>
                        </div>
                    )}
                    {(Array.isArray(messages) ? messages : []).map((msg, index) => {
                        // FIX: Robust check for Sender ID whether from Live Socket or Database
                        const msgSenderId = msg.senderId || (msg.sender?._id || msg.sender);
                        const isMe = String(msgSenderId) === String(auth.user?.id);
                        const senderDisplayName = msg.senderName || (isMe ? auth.user?.name : recipientName);

                        let isCustomOffer = false;
                        let offerData = null;
                        let isOfferAccepted = false;
                        let acceptedData = null;
                        let isAttachment = false;
                        let attachmentData = null;
                        let isAudio = false;
                        let audioData = null;
                        let isMeeting = false;
                        let meetingData = null;

                        if (typeof msg.text === 'string' && msg.text.startsWith('[CUSTOM_OFFER]:::')) {
                            isCustomOffer = true;
                            try {
                                offerData = JSON.parse(msg.text.replace('[CUSTOM_OFFER]:::', ''));
                            } catch(e) { isCustomOffer = false; }
                        }
                        else if (typeof msg.text === 'string' && msg.text.startsWith('[OFFER_ACCEPTED]:::')) {
                            isOfferAccepted = true;
                            try {
                                acceptedData = JSON.parse(msg.text.replace('[OFFER_ACCEPTED]:::', ''));
                            } catch(e) { isOfferAccepted = false; }
                        }
                        else if (typeof msg.text === 'string' && msg.text.startsWith('[ATTACHMENT]:::')) {
                            isAttachment = true;
                            try {
                                attachmentData = JSON.parse(msg.text.replace('[ATTACHMENT]:::', ''));
                            } catch(e) { isAttachment = false; }
                        }
                        else if (typeof msg.text === 'string' && msg.text.startsWith('[AUDIO]:::')) {
                            isAudio = true;
                            try {
                                audioData = JSON.parse(msg.text.replace('[AUDIO]:::', ''));
                            } catch(e) { isAudio = false; }
                        } else if (typeof msg.text === 'string' && msg.text.startsWith('[MEETING]:::')) {
                            isMeeting = true;
                            try {
                                meetingData = JSON.parse(msg.text.replace('[MEETING]:::', ''));
                            } catch(e) { isMeeting = false; }
                        }

                        return (
                        <div key={index} className={`mb-4 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] lg:max-w-md ${(isCustomOffer || isOfferAccepted || isAttachment || isAudio || isMeeting) ? '' : 'px-5 py-3'} rounded-3xl shadow-sm ${(!isCustomOffer && !isOfferAccepted && !isAttachment && !isAudio && !isMeeting) ? (isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm') : ''}`}>
                                {isCustomOffer && offerData ? (
                                    <div className={`w-full sm:w-80 border ${isMe ? 'border-blue-200 bg-blue-50 text-gray-800' : 'border-gray-200 bg-white text-gray-800'} rounded-2xl p-5 shadow-md`}>
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200/60">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100">📄</div>
                                            <div>
                                                <p className="text-sm font-extrabold text-gray-800">Custom Offer</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{isMe ? 'Sent by you' : `From ${senderDisplayName}`}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-5 italic line-clamp-3">"{offerData.description}"</p>
                                        <div className="flex justify-between items-center mb-5 bg-white/60 p-3 rounded-xl border border-gray-200/50 shadow-sm">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Amount</p>
                                                <p className="text-lg font-extrabold text-green-600">₹{offerData.amount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Delivery</p>
                                                <p className="text-sm font-bold text-gray-800">{offerData.time}</p>
                                            </div>
                                        </div>
                                        {!isMe ? (
                                            <button onClick={() => {
                                                if (window.confirm(`Accept this offer for ₹${offerData.amount}?`)) {
                                                    const acceptText = `[OFFER_ACCEPTED]:::${JSON.stringify(offerData)}`;
                                                    const messageData = { senderId: auth.user.id, senderName: auth.user.name, text: acceptText, timestamp: new Date().toISOString() };
                                                    socket.emit('sendMessage', { roomName, messageData });
                                                }
                                            }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm">Accept Offer</button>
                                        ) : (
                                            <p className="text-xs text-center text-gray-500 font-bold bg-white/50 py-2 rounded-lg border border-gray-100">Waiting for response...</p>
                                        )}
                                    </div>
                                ) : isOfferAccepted && acceptedData ? (
                                    <div className={`w-full sm:w-80 border ${isMe ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} rounded-2xl p-4 shadow-sm flex items-center gap-4`}>
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl shrink-0 shadow-inner">🤝</div>
                                        <div>
                                            <p className="text-sm font-extrabold text-gray-800">Offer Accepted!</p>
                                            <p className="text-xs text-gray-600 font-medium">₹{acceptedData.amount} for {acceptedData.time}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{isMe ? 'You accepted' : `${senderDisplayName} accepted`}</p>
                                        </div>
                                    </div>
                                ) : isAttachment && attachmentData ? (
                                    <div 
                                        className={`w-full sm:w-80 border ${isMe ? 'border-blue-400 bg-blue-600' : 'border-gray-200 bg-white'} rounded-2xl p-2 shadow-sm cursor-pointer hover:opacity-95 transition-opacity`}
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = attachmentData.content;
                                            a.download = attachmentData.name;
                                            a.click();
                                        }}
                                        title="Click to download"
                                    >
                                        {attachmentData.type?.startsWith('image/') && attachmentData.content && (
                                            <img src={attachmentData.content} alt={attachmentData.name} className="w-full h-40 object-cover rounded-xl mb-2 bg-white" />
                                        )}
                                        <div className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-blue-700/50' : 'bg-gray-50'}`}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm shrink-0 ${isMe ? 'bg-blue-500' : 'bg-white border border-gray-200'}`}>
                                                {attachmentData.type?.startsWith('image/') ? '🖼️' : '📄'}
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <p className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-gray-800'}`}>{attachmentData.name}</p>
                                                <p className={`text-[10px] font-medium ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>{(attachmentData.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                ) : isAudio && audioData ? (
                                    <div className={`flex items-center gap-3 p-1.5 rounded-full shadow-sm ${isMe ? 'bg-blue-700/80 border border-blue-600' : 'bg-white border border-gray-200'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0 ${isMe ? 'bg-blue-500' : 'bg-gray-100'}`}>
                                            🎙️
                                        </div>
                                        <audio controls src={audioData.content} className="max-w-[180px] sm:max-w-[220px] h-8 outline-none bg-transparent" />
                                    </div>
                                ) : isMeeting && meetingData ? (
                                    <div className={`w-full sm:w-80 border ${isMe ? 'border-purple-200 bg-purple-50 text-gray-800' : 'border-gray-200 bg-white text-gray-800'} rounded-2xl p-5 shadow-md`}>
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200/60">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl border border-gray-100">📹</div>
                                            <div>
                                                <p className="text-sm font-extrabold text-gray-800">Video Interview</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{isMe ? 'Started by you' : `Started by ${senderDisplayName}`}</p>
                                            </div>
                                        </div>
                                        <a href={meetingData.link} target="_blank" rel="noopener noreferrer" className="w-full block text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm">Join Video Call</a>
                                    </div>
                                ) : (
                                    <p className="text-[15px] leading-relaxed">{renderMessageText(msg.text)}</p>
                                )}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <p className="text-[11px] text-gray-400">
                                    {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {isMe && (
                                    <div className={`flex -space-x-1.5 ${msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        {msg.status !== 'sent' && (
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </ErrorBoundary>

            {/* Pill-shaped Input Area */}
            <ErrorBoundary componentName="Message Input Area">
                <div className="p-4 bg-white border-t border-gray-200 relative">
                    
                    {/* Attachment Preview Banner */}
                    {attachment && (
                        <div className="absolute bottom-full left-4 mb-2 bg-white border border-gray-200 shadow-xl rounded-2xl p-3 flex items-center gap-3 animate-slide-up z-40 pr-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl border border-blue-100 shadow-inner">
                                {attachment.type?.startsWith('image/') ? '🖼️' : '📄'}
                            </div>
                            <div className="max-w-[200px] sm:max-w-[300px]">
                                <p className="text-sm font-bold text-gray-800 truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-500 font-medium">Ready to send • {(attachment.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => setAttachment(null)} className="ml-auto w-8 h-8 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full flex items-center justify-center transition-colors font-bold shadow-sm">✕</button>
                        </div>
                    )}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="absolute -top-6 left-6 flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-white/80 px-2 py-0.5 rounded-t-lg">
                            <span className="flex gap-0.5">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                            </span>
                            {recipientName} is typing...
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        {isRecording ? (
                            <div className="flex-1 py-3.5 px-6 bg-red-50 border border-red-200 rounded-full flex items-center justify-between text-red-600 animate-pulse shadow-inner">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                                    Recording Audio...
                                </div>
                                <span className="font-mono font-bold tracking-widest">
                                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                                <button type="button" onClick={cancelRecording} className="text-sm font-bold hover:text-red-800 ml-4 bg-white px-3 py-1 rounded-full border border-red-100 shadow-sm transition-colors">Cancel</button>
                            </div>
                        ) : (
                            <>
                            <div className="relative" ref={actionsRef}>
                            <button type="button" onClick={() => setShowActions(!showActions)} className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-blue-600 flex items-center justify-center transition-colors shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                            {showActions && (
                                <div className="absolute bottom-full left-0 mb-3 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 animate-slide-up z-50">
                                    <label className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors group cursor-pointer mb-1">
                                        <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">📎</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Attach File</p>
                                            <p className="text-[10px] text-gray-500">Images, PDFs, Docs</p>
                                        </div>
                                        <input type="file" className="hidden" onChange={(e) => { 
                                            const file = e.target.files[0];
                                            if(file) {
                                                if (file.size > 1 * 1024 * 1024) {
                                                    alert('For performance, attachments over websockets are limited to 1MB. (Enterprise Cloud Storage coming soon!)');
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setAttachment({
                                                        name: file.name, size: file.size, type: file.type,
                                                        content: event.target.result
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                            setShowActions(false); 
                                        }} />
                                    </label>
                                    <button type="button" onClick={() => { setShowActions(false); setIsOfferModalOpen(true); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-xl flex items-center gap-3 transition-colors group">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">📄</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Custom Offer</p>
                                            <p className="text-[10px] text-gray-500">Send a tailored proposal</p>
                                        </div>
                                    </button>
                                    <button type="button" onClick={handleStartInterview} className="w-full text-left px-4 py-3 hover:bg-purple-50 rounded-xl flex items-center gap-3 transition-colors group mt-1">
                                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">📹</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Start Interview</p>
                                            <p className="text-[10px] text-gray-500">Secure Video Call</p>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => { setShowActions(false); alert("Request Payment Feature Coming Soon!"); }} className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-xl flex items-center gap-3 transition-colors group mt-1">
                                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">💳</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Request Payment</p>
                                            <p className="text-[10px] text-gray-500">Ask for milestone release</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="flex-1 py-3.5 px-6 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-gray-800"
                        />
                            </>
                        )}
                        
                        {!newMessage.trim() && !attachment && !isRecording ? (
                            <button type="button" onClick={startRecording} className="bg-gray-100 text-gray-600 p-3.5 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-all flex-shrink-0 shadow-sm border border-transparent">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                            </button>
                        ) : isRecording ? (
                            <button type="button" onClick={stopRecording} className="bg-blue-600 text-white p-3.5 rounded-full hover:bg-blue-700 transition-all flex-shrink-0 shadow-md animate-bounce">
                                <svg className="w-5 h-5 transform rotate-90 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                            </button>
                        ) : (
                            <button type="submit" disabled={!newMessage.trim() && !attachment} className="bg-blue-600 text-white p-3.5 rounded-full hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 shadow-md">
                                <svg className="w-5 h-5 transform rotate-90 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                            </button>
                        )}
                    </form>
                </div>
            </ErrorBoundary>

            {/* --- Custom Offer Modal --- */}
            {isOfferModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsOfferModalOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-extrabold text-lg text-gray-800 flex items-center gap-2"><span className="text-2xl">📄</span> Create Custom Offer</h3>
                            <button onClick={() => setIsOfferModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSendOffer} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Amount (₹)</label>
                                    <input type="number" required value={offerDetails.amount} onChange={e => setOfferDetails({...offerDetails, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold text-gray-800 text-lg" placeholder="5000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Delivery Time</label>
                                    <input type="text" required value={offerDetails.time} onChange={e => setOfferDetails({...offerDetails, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold text-gray-800 text-lg" placeholder="e.g. 3 Days" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Description / Deliverables</label>
                                <textarea required rows="3" value={offerDetails.description} onChange={e => setOfferDetails({...offerDetails, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm text-gray-800 font-medium resize-none" placeholder="What exactly will you deliver for this amount?"></textarea>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base">
                                    Send Offer 🚀
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ChatPage;