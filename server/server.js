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
const cookieParser = require('cookie-parser');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { globalLimiter, authLimiter, twoFaLimiter, paymentLimiter } = require('./middleware/rateLimiters');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- Redis Adapter for PM2 Cluster Scaling ---
// Note: Requires REDIS_URL in .env and redis server running
if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('🔗 Redis Adapter connected for Socket.io scaling');
    }).catch(err => console.error('Redis connection error:', err));
}

connectDB();

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like server-to-server or Stripe Webhooks) and allowed domains
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// FIX: Prevent express.json() from breaking Stripe Webhooks (which need raw unparsed buffer)
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') return next();
    express.json({ limit: '20mb' })(req, res, next);
});
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cookieParser());

app.use('/api', globalLimiter);

// --- API Routes ---
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/gigs', require('./routes/gigs'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/2fa', twoFaLimiter, require('./routes/twoFactor'));
app.use('/api/payments', paymentLimiter, require('./routes/payments')); 
app.use('/api/transactions', require('./routes/transactions')); 
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai')); // Fixed rogue nested route
app.use('/api/skills', require('./routes/skills')); // Moved Skill Verification to backend
app.use('/api/aggregated', require('./routes/aggregated')); // Performance Optimized endpoints


// --- Initialize Socket.IO Handlers ---
require('./socketHandler')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server (with Socket.IO) started on port ${PORT}`));