const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: { 
        type: String, 
        required: true, 
        index: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);