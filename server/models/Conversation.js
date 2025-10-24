const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
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