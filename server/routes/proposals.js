const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Proposal = require('../models/Proposal');
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

// --- NEW: Route to manually update proposal status (for Kanban drag & drop) ---
router.put('/:proposalId/status', auth, async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.proposalId);
        if (!proposal) return res.status(404).json({ msg: 'Proposal not found' });
        
        // Only allow freelancer who created it to change its status (e.g. Pitched -> Interviewing)
        if (proposal.freelancer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        // 🚨 CRITICAL SECURITY FIX: Prevent freelancers from forcing 'Accepted' status
        const allowedStatuses = ['Submitted', 'Interviewing', 'Withdrawn'];
        if (!allowedStatuses.includes(req.body.status)) {
            return res.status(403).json({ msg: 'Forbidden: You cannot forcefully accept or reject your own proposal.' });
        }

        proposal.status = req.body.status;
        await proposal.save();
        res.json(proposal);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;