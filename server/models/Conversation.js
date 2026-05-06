/**
 * Conversation Model
 * UPDATED: May 6, 2026 - Real-time Messaging System Enhancement
 * 
 * Stores:
 * - Conversation participants
 * - Last message preview
 * - Last message timestamp
 * - Conversation creation time
 * - Message count
 * - Conversation status
 * - Read/unread status for each participant
 */

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    // Stable unique id for the private room (sorted userIds joined by "-")
    roomId: { type: String, unique: true, sparse: true, index: true },
    // An array of the two users in the chat
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        text: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);