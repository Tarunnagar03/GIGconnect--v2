// server/controllers/proposalController.js
const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');

// @desc    Submit a proposal for a gig
exports.submitProposal = async (req, res) => {
    const { gigId, coverLetter, bidAmount } = req.body;
    const freelancerId = req.user.id;
    try {
        const gig = await Gig.findById(gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.status !== 'Open') return res.status(400).json({ msg: 'This gig is no longer open for proposals' });
        const existingProposal = await Proposal.findOne({ gig: gigId, freelancer: freelancerId });
        if (existingProposal) return res.status(400).json({ msg: 'You have already submitted a proposal for this gig' });

        const newProposal = new Proposal({
            gig: gigId,
            freelancer: freelancerId,
            client: gig.client,
            coverLetter,
            bidAmount,
        });
        const proposal = await newProposal.save();
        res.status(201).json(proposal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all proposals submitted by the logged-in freelancer
exports.getMyProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find({ freelancer: req.user.id })
            .populate('gig', 'title status')
            .sort({ createdAt: -1 });
        res.json(proposals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all proposals received for a specific gig (for the client)
exports.getGigProposals = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.client.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        const proposals = await Proposal.find({ gig: req.params.gigId })
            .populate('freelancer', 'name username headline')
            .sort({ createdAt: 1 });
        res.json(proposals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Accept a proposal
exports.acceptProposal = async (req, res) => {
    const { proposalId } = req.params;
    const clientId = req.user.id;
    try {
        const proposal = await Proposal.findById(proposalId).populate('gig');
        if (!proposal) return res.status(404).json({ msg: 'Proposal not found' });
        if (proposal.client.toString() !== clientId) return res.status(401).json({ msg: 'Not authorized' });
        if (proposal.gig.status !== 'Open') return res.status(400).json({ msg: 'Gig is not open for assignment' });

        const gig = proposal.gig;
        await Gig.findByIdAndUpdate(gig._id, {
            $set: { assignedFreelancer: proposal.freelancer, status: 'In Progress' }
        });

        proposal.status = 'Accepted';
        await proposal.save();
        await Proposal.updateMany(
            { gig: gig._id, _id: { $ne: proposalId } },
            { $set: { status: 'Rejected' } }
        );
        res.json({ msg: 'Proposal accepted and gig assigned.', gig });
    } catch (err) {
        console.error("Accept Proposal error:", err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// --- UPDATED: Reject a proposal (with mandatory reason) ---
exports.rejectProposal = async (req, res) => {
    const { proposalId } = req.params;
    const { rejectionReason } = req.body; // Get reason from request body
    const clientId = req.user.id;

    // Validate that a reason was provided
    if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({ msg: 'A rejection reason is required.' });
    }

    try {
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return res.status(404).json({ msg: 'Proposal not found' });
        if (proposal.client.toString() !== clientId) return res.status(401).json({ msg: 'Not authorized' });

        // Update status and save the reason
        proposal.status = 'Rejected';
        proposal.rejectionReason = rejectionReason.trim(); // Save the reason
        await proposal.save();

        res.json({ msg: 'Proposal rejected.', proposal });
    } catch (err) {
        console.error("Reject Proposal error:", err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};