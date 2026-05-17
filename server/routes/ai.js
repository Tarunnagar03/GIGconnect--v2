const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateProposal } = require('../controllers/aiController');

// @route   POST api/ai/generate-proposal
// @desc    Generate cover letter using AI Assistant
// @access  Private
router.post('/generate-proposal', auth, generateProposal);

module.exports = router;