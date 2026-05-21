const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateProposal } = require('../controllers/aiController');

// @route   POST api/ai/generate-proposal
// @desc    Generate or modify proposal text using AI
// @access  Private
router.post('/generate-proposal', auth, generateProposal);

module.exports = router;