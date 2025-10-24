// server/routes/messages.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages, getRecipientDetails } = require('../controllers/messageController');

// @route  GET api/messages/:roomId
// @desc   Get all messages for a specific conversation room
// @access Private
router.get('/:roomId', auth, getMessages);

// @route  GET api/messages/user/:userId
// @desc   Get the details (like name) of a specific user for the chat header
// @access Private
router.get('/user/:userId', auth, getRecipientDetails);

module.exports = router;