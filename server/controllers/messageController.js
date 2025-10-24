// server/controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages for a specific conversation room
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.roomId })
            .populate('sender', 'name') // Get the sender's name
            .sort({ createdAt: 1 });   // Sort from oldest to newest

        // Format messages to match what the frontend chat expects
        const formattedMessages = messages.map(msg => ({
            senderId: msg.sender._id,
            senderName: msg.sender.name,
            text: msg.text,
            timestamp: msg.createdAt
        }));

        res.json(formattedMessages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get the name of the other user in the chat
exports.getRecipientDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};