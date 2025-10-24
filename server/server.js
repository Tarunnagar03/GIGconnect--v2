// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

connectDB();

app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/gigs', require('./routes/gigs'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/2fa', require('./routes/twoFactor'));
app.use('/api/payments', require('./routes/payments')); 
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/contact', require('./routes/contact.js'));

let onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    socket.on('addUser', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        console.log(`User ${socket.id} joined room: ${roomName}`);
    });

    // --- THIS IS THE CORRECTED DATABASE LOGIC ---
    socket.on('sendMessage', async ({ roomName, messageData }) => {
        try {
            // 1. Save the message to the database
            const message = new Message({
                conversationId: roomName,
                sender: messageData.senderId,
                text: messageData.text
            });
            await message.save();

            // 2. Find or Create the conversation and update its last message
            const participantIds = roomName.split('-');

            const filter = { participants: { $all: participantIds } };

            const update = {
                // Always update the last message
                $set: {
                    lastMessage: {
                        text: messageData.text,
                        sender: messageData.senderId,
                        timestamp: new Date()
                    }
                },
                // This ensures 'participants' is only set when creating a new document
                $setOnInsert: {
                    participants: participantIds
                }
            };

            await Conversation.findOneAndUpdate(filter, update, { upsert: true, new: true });

            // 3. Broadcast the message to all users in the private room
            io.to(roomName).emit('receiveMessage', messageData);

        } catch (error) {
            // This will log any database error if it happens again
            console.error('--- CRITICAL ERROR IN sendMessage ---:', error);
        }
    });

    socket.on('disconnect', () => {
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
        console.log('❌ User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server (with Socket.IO) started on port ${PORT}`));