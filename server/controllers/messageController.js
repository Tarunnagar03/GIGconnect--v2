// server/controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

// Get all messages for a specific conversation room
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.roomId })
            .populate('sender', 'name') // Get the sender's name
            .sort({ createdAt: 1 });   // Sort from oldest to newest

        // Format messages to match what the frontend chat expects
        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            senderId: msg.sender?._id || msg.sender,
            senderName: msg.sender?.name || 'Unknown User',
            text: msg.text,
            timestamp: msg.createdAt,
            status: msg.status || 'sent'
        }));

        res.json(formattedMessages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get total unread message count for the current user
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find all conversations the user is part of
        const convos = await Conversation.find({ participants: userId });
        const roomIds = convos.map(c => c.roomId);

        // Count unread messages in these rooms not sent by the user
        const count = await Message.countDocuments({
            conversationId: { $in: roomIds },
            sender: { $ne: userId },
            status: { $ne: 'read' }
        });

        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get the name of the other user in the chat
exports.getRecipientDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name role');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};