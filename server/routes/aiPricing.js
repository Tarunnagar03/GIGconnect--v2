const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { suggestPricing } = require('../controllers/aiPricingController');

// @route   POST api/ai-pricing/suggest
// @desc    Get AI suggested pricing for gig or proposal
// router.post('/suggest', auth, suggestPricing); // Attach auth middleware for protected route
router.post('/suggest', auth, suggestPricing);

module.exports = router;