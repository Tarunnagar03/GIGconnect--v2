const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    submitProposal,
    getMyProposals,
    getGigProposals,
    acceptProposal, // <-- Ensure this is imported
    rejectProposal  // <-- Ensure this is imported
} = require('../controllers/proposalController');

router.post('/', auth, submitProposal);
router.get('/my-proposals', auth, getMyProposals);
router.get('/gig/:gigId', auth, getGigProposals);

// --- THESE ROUTES WERE MISSING ---
router.put('/accept/:proposalId', auth, acceptProposal);
router.put('/reject/:proposalId', auth, rejectProposal);

module.exports = router;