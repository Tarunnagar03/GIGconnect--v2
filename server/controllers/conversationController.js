/**
 * Conversation Controller
 * UPDATED: May 6, 2026 - Real-time Messaging Enhancement
 * 
 * Manages:
 * - Conversation creation and management
 * - Conversation participants
 * - Last message tracking
 * - Conversation retrieval
 * - User's conversations list
 * - Conversation deletion
 * - Socket.IO integration for real-time updates
 */

// server/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');

exports.getMyConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        const myObjectId = new mongoose.Types.ObjectId(myId);

        // Backward-compatible query: some older rows may have string participants.
        const conversations = await Conversation.find({
            participants: { $in: [myId, myObjectId] }
        })
            .populate('participants', 'name role profileImage')
            .sort({ updatedAt: -1 });

        // Auto-repair: if any conversation has string participants, convert to ObjectId and save.
        const repairs = conversations
            .filter((c) => Array.isArray(c.participants) && c.participants.some((p) => typeof p === 'string'))
            .map(async (c) => {
                const fixed = c.participants.map((p) => (typeof p === 'string' ? new mongoose.Types.ObjectId(p) : p));
                await Conversation.updateOne({ _id: c._id }, { $set: { participants: fixed } });
            });
        if (repairs.length) await Promise.all(repairs);

        // Fetch unread count for each conversation exactly like WhatsApp
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (c) => {
                const convoObj = c.toObject();
                convoObj.unreadCount = await Message.countDocuments({
                    conversationId: convoObj.roomId,
                    sender: { $ne: myId },
                    status: { $ne: 'read' }
                });

                // 🛡️ SECURITY & UX: Mask Admin details for regular users in their Inbox
                if (req.user.role !== 'Admin') {
                    convoObj.participants = convoObj.participants.map(p => {
                        if (p.role === 'Admin') {
                            p.name = 'GigConnect Support';
                        }
                        return p;
                    });
                }

                return convoObj;
            })
        );

        res.json(conversationsWithUnread);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};