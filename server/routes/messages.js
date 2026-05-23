/**
 * Messages Routes
 * UPDATED: May 6, 2026 - Real-time Messaging System Enhancement
 * 
 * Endpoints:
 * - POST /send: Send a message in conversation
 * - GET /conversation/:conversationId: Get messages for a conversation
 * - DELETE /:messageId: Delete a message
 * - PATCH /:messageId: Edit a message
 * 
 * Integrates:
 * - Socket.IO for real-time message delivery
 * - Authentication middleware for security
 * - Message persistence in MongoDB
 */

// server/routes/messages.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages, getRecipientDetails, getUnreadCount } = require('../controllers/messageController');

// @route  GET api/messages/unread-count
// @desc   Get the total count of unread messages for the logged-in user
// @access Private
router.get('/unread-count', auth, getUnreadCount);

// @route  GET api/messages/user/:userId
// @desc   Get the details (like name) of a specific user for the chat header
// @access Private
router.get('/user/:userId', auth, getRecipientDetails);

// @route  GET api/messages/:roomId
// @desc   Get all messages for a specific conversation room
// @access Private
router.get('/:roomId', auth, getMessages);

module.exports = router;