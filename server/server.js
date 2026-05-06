/**
 * GigConnect Server
 * UPDATED: May 6, 2026 - Backend Enhancement & Feature Integration
 * 
 * Server Features:
 * - Express API with comprehensive route handlers
 * - Socket.IO for real-time messaging
 * - MongoDB integration for data persistence
 * - JWT authentication and authorization
 * - CORS configuration for frontend communication
 * - Error handling middleware
 * - RESTful API endpoints for all features
 * 
 * Main Modules Implemented:
 * - Authentication (JWT-based)
 * - User Management
 * - Gig Management
 * - Proposals & Bidding
 * - Real-time Chat
 * - Reviews & Ratings
 * - Payment Processing
 * - Admin Dashboard
 * - Two-Factor Authentication
 * - Transaction History
 */

// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
app.use('/api/admin', require('./routes/admin'));

let onlineUsers = new Map();

// Authenticate sockets via JWT (sent from client as socket.auth.token)
io.use((socket, next) => {
    try {
        const token = socket.handshake?.auth?.token;
        if (!token) return next(new Error('No auth token'));
        const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET);
        socket.user = decoded.user;
        return next();
    } catch (err) {
        return next(new Error('Invalid auth token'));
    }
});

io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    // Always register the authenticated user immediately.
    const userId = socket.user?.id;
    if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    }

    // Kept for backward compatibility with older client builds.
    socket.on('addUser', () => {
        const uid = socket.user?.id;
        if (!uid) return;
        onlineUsers.set(uid, socket.id);
        socket.join(`user:${uid}`);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        console.log(`User ${socket.id} joined room: ${roomName}`);
    });

    // --- THIS IS THE CORRECTED DATABASE LOGIC ---
    socket.on('sendMessage', async ({ roomName, messageData }) => {
        try {
            // Basic authorization: sender must match the authenticated socket user
            if (!socket.user?.id || messageData?.senderId !== socket.user.id) {
                return;
            }

            // 1. Save the message to the database
            const message = new Message({
                conversationId: roomName,
                sender: messageData.senderId,
                text: messageData.text
            });
            await message.save();

            // 2. Find or Create the conversation and update its last message
            const participantIds = roomName.split('-');
            const participantObjectIds = participantIds
                .filter(Boolean)
                .map((id) => new mongoose.Types.ObjectId(id));

            // Upsert by roomId to avoid Mongo upsert inference issues on array queries
            const filter = { roomId: roomName };

            const update = {
                // Always update the last message
                $set: {
                    lastMessage: {
                        text: messageData.text,
                        sender: new mongoose.Types.ObjectId(messageData.senderId),
                        timestamp: new Date()
                    }
                },
                // This ensures 'participants' is only set when creating a new document
                $setOnInsert: {
                    roomId: roomName,
                    participants: participantObjectIds
                }
            };

            const convo = await Conversation.findOneAndUpdate(filter, update, { upsert: true, new: true })
                .populate('participants', 'name role');

            // 3. Broadcast the message to all users in the private room
            io.to(roomName).emit('receiveMessage', messageData);

            // 4. Update inbox UI for both participants (even if they aren't on ChatPage)
            if (convo) {
                for (const participantId of participantIds) {
                    if (!participantId) continue;
                    io.to(`user:${participantId}`).emit('conversationUpdated', convo);
                }
            }

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