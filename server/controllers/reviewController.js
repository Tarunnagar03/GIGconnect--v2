const Review = require('../models/Review');
const Gig = require('../models/Gig');

// Client reviewing the Freelancer
exports.createReview = async (req, res) => {
    try {
        const { gigId, rating, comment } = req.body;
        const gig = await Gig.findById(gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        
        if (gig.client.toString() !== req.user.id) return res.status(401).json({ msg: 'Only the client can review the freelancer' });

        const newReview = new Review({ gig: gigId, reviewer: req.user.id, freelancer: gig.assignedFreelancer, client: gig.client, rating, comment });
        await newReview.save();
        res.json(newReview);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Freelancer reviewing the Client
exports.createClientFeedback = async (req, res) => {
    try {
        const { gigId, rating, comment } = req.body;
        const gig = await Gig.findById(gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        
        if (gig.assignedFreelancer.toString() !== req.user.id) return res.status(401).json({ msg: 'Only the assigned freelancer can review the client' });

        const newReview = new Review({ gig: gigId, reviewer: req.user.id, client: gig.client, freelancer: gig.assignedFreelancer, rating, comment, isClientFeedback: true });
        await newReview.save();
        res.json(newReview);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getMyReviews = async (req, res) => {
    try { res.json(await Review.find({ reviewer: req.user.id }).populate('gig', 'title')); } 
    catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.getClientReviews = async (req, res) => {
    try { res.json(await Review.find({ client: req.params.clientId, isClientFeedback: true }).populate('reviewer', 'name')); } 
    catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.getFreelancerReviews = async (req, res) => {
    try { res.json(await Review.find({ freelancer: req.params.freelancerId, isClientFeedback: false }).populate('reviewer', 'name').populate('client', 'name')); } 
    catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};