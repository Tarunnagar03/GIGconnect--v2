const Review = require('../models/Review');
const Gig = require('../models/Gig');

// @desc    Create a new review for a gig
exports.createReview = async (req, res) => {
    const { gigId, rating, comment } = req.body;
    const clientId = req.user.id;

    try {
        const gig = await Gig.findById(gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.client.toString() !== clientId) return res.status(401).json({ msg: 'Not authorized' });
        if (gig.status !== 'Completed') return res.status(400).json({ msg: 'Gig is not completed yet' });
        if (!gig.assignedFreelancer) return res.status(400).json({ msg: 'No freelancer was assigned' });
        
        // Check if a review already exists
        const existingReview = await Review.findOne({ gig: gigId, client: clientId });
        if (existingReview) return res.status(400).json({ msg: 'Review already submitted for this gig' });

        const review = new Review({
            gig: gigId,
            client: clientId,
            freelancer: gig.assignedFreelancer,
            rating,
            comment,
        });

        await review.save();
        res.status(201).json(review);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all reviews for a specific freelancer
exports.getFreelancerReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ freelancer: req.params.freelancerId })
            .populate('client', ['name'])
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- NEW FUNCTION ---
// @desc    Get all reviews written by the logged-in client
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ client: req.user.id })
            .populate('freelancer', 'name'); // Show who they reviewed
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};