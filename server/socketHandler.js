const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = (io) => {
    // Middleware to authenticate socket connections via JWT
    io.use((socket, next) => {
        try {
            let token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization;
            
            // 🚀 FIX 1: Extract JWT from HttpOnly Cookie for Secure Socket Auth
            if (!token && socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';');
                const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
                if (tokenCookie) token = tokenCookie.split('=')[1];
            }

            if (!token) return next(new Error('No auth token'));
            const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET);
            socket.user = decoded.user || decoded;
            return next();
        } catch (err) {
            return next(new Error('Invalid auth token'));
        }
    });

    const broadcastOnlineUsers = async () => {
        try {
            const sockets = await io.fetchSockets();
            const activeUsers = [...new Set(sockets.map(s => s.user?.id).filter(Boolean))];
            io.emit('getOnlineUsers', activeUsers);
        } catch (err) {
            console.error('Error fetching cluster sockets:', err);
        }
    };

    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (userId) {
            socket.join(`user:${userId}`);
            broadcastOnlineUsers();
        }

        socket.on('addUser', () => {
            if (!socket.user?.id) return;
            socket.join(`user:${socket.user.id}`);
            broadcastOnlineUsers();
        });

        socket.on('joinRoom', (roomName) => {
            socket.join(roomName);
        });

        socket.on('sendMessage', async ({ roomName, messageData }) => {
            try {
                if (!socket.user?.id || messageData?.senderId !== socket.user.id) return;
                
                const Message = mongoose.model('Message');
                const Conversation = mongoose.model('Conversation');

                // 1. Get or Create Conversation FIRST
                const recipientId = roomName.split('-').find(id => id !== socket.user.id);
                let convo = await Conversation.findOne({ roomId: roomName });
                if (!convo) {
                    convo = new Conversation({
                        roomId: roomName,
                        participants: [socket.user.id, recipientId]
                    });
                    await convo.save();
                }

                // 2. Save message permanently to MongoDB
                // 🚀 FIX 2: conversationId MUST be roomName to match the REST API fetch logic
                const newMessage = new Message({
                    conversationId: roomName,
                    sender: socket.user.id,
                    text: messageData.text,
                    status: 'delivered'
                });
                await newMessage.save();

                // 3. Update Conversation's lastMessage & populate
                // 🚀 FIX 3: lastMessage expects an object, not an ObjectId
                convo = await Conversation.findByIdAndUpdate(convo._id, { 
                    lastMessage: { text: messageData.text, sender: socket.user.id, timestamp: newMessage.createdAt } 
                }, { new: true }).populate('participants', 'name email profileImage role');

                // 4. Broadcast to room with real DB info
                const finalMessage = { ...messageData, _id: newMessage._id, timestamp: newMessage.createdAt || new Date().toISOString() };
                finalMessage.status = 'delivered';
                io.to(roomName).emit('receiveMessage', finalMessage);
                
                // 5. Fire global event to trigger Navbar Toasts & Inbox updates
                io.emit('conversationUpdated', convo);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('markAsRead', async ({ roomName, userId }) => {
            try {
                const Message = mongoose.model('Message');
                await Message.updateMany(
                    { conversationId: roomName, sender: { $ne: userId }, status: { $ne: 'read' } },
                    { $set: { status: 'read' } }
                );
                socket.to(roomName).emit('messagesRead', { byUserId: userId });
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        });

        socket.on('deleteMessage', async ({ roomName, messageId }) => {
            try {
                const Message = mongoose.model('Message');
                const msg = await Message.findById(messageId);
                if (msg && String(msg.sender) === String(socket.user.id)) {
                    msg.text = '[DELETED]';
                    await msg.save();
                    io.to(roomName).emit('messageDeleted', { messageId });
                    
                    const Conversation = mongoose.model('Conversation');
                    const convo = await Conversation.findOne({ roomId: roomName });
                    if (convo) {
                        const lastMsg = await Message.findOne({ conversationId: roomName }).sort({ createdAt: -1 });
                        convo.lastMessage = lastMsg ? { text: lastMsg.text, sender: lastMsg.sender, timestamp: lastMsg.createdAt } : null;
                        await convo.save();
                        await convo.populate('participants', 'name email profileImage role');
                        io.emit('conversationUpdated', convo);
                    }
                }
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        });

        socket.on('typing', ({ roomName, senderId }) => socket.to(roomName).emit('typing', { senderId }));
        socket.on('stopTyping', ({ roomName, senderId }) => socket.to(roomName).emit('stopTyping', { senderId }));
        
        socket.on('disconnect', () => {
            broadcastOnlineUsers();
        });
    });
};