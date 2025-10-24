// server/controllers/conversationController.js
const Conversation = require('../models/Conversation');

exports.getMyConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id // Find all conversations where the current user is a participant
        })
        .populate('participants', 'name role') // Crucially, get the name and role of both users
        .sort({ updatedAt: -1 }); // Sort by the most recently active conversation

        res.json(conversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};