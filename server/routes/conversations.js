const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMyConversations } = require('../controllers/conversationController');

// @route  GET api/conversations
// @desc   Get all conversations for the logged-in user
router.get('/', auth, getMyConversations);

module.exports = router;