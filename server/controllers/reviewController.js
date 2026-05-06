/**
 * Review Controller
 * UPDATED: May 6, 2026 - Review & Rating System Enhancement
 * 
 * Manages:
 * - Review creation and submission
 * - Rating management (1-5 stars)
 * - Review text and comments
 * - Review deletion
 * - Average rating calculations
 * - Review retrieval and filtering
 * - Client/Freelancer review statistics
 */

const Review = require('../models/Review');
const Gig = require('../models/Gig');
const Profile = require('../models/Profile');

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
            reviewer: clientId,
            reviewee: gig.assignedFreelancer,
            reviewerRole: 'Client',
            revieweeRole: 'Freelancer',
            rating,
            comment,
        });

        await review.save();

        // Update denormalized rating summary on freelancer profile
        const agg = await Review.aggregate([
            { $match: { freelancer: gig.assignedFreelancer } },
            { $group: { _id: '$freelancer', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);
        if (agg?.length) {
            await Profile.findOneAndUpdate(
                { user: gig.assignedFreelancer },
                { $set: { ratingAvg: agg[0].avg, ratingCount: agg[0].count } },
                { new: false }
            );
        }

        res.status(201).json(review);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create freelancer->client feedback for a completed gig
// @route   POST api/reviews/client-feedback
exports.createClientFeedback = async (req, res) => {
    const { gigId, rating, comment } = req.body;
    const freelancerId = req.user.id;

    try {
        const gig = await Gig.findById(gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (!gig.assignedFreelancer) return res.status(400).json({ msg: 'No freelancer was assigned' });
        if (gig.assignedFreelancer.toString() !== freelancerId) return res.status(401).json({ msg: 'Not authorized' });
        if (gig.status !== 'Completed') return res.status(400).json({ msg: 'Gig is not completed yet' });

        const existingReview = await Review.findOne({ gig: gigId, reviewer: freelancerId });
        if (existingReview) return res.status(400).json({ msg: 'Feedback already submitted for this gig' });

        const review = new Review({
            gig: gigId,
            client: gig.client,
            freelancer: freelancerId,
            reviewer: freelancerId,
            reviewee: gig.client,
            reviewerRole: 'Freelancer',
            revieweeRole: 'Client',
            rating,
            comment
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

// @desc    Get all feedback for a specific client (written by freelancers)
// @route   GET api/reviews/client/:clientId
exports.getClientReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.clientId, revieweeRole: 'Client' })
            .populate('reviewer', ['name'])
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
        const reviews = await Review.find({
            $or: [
                { client: req.user.id },
                { reviewer: req.user.id }
            ]
        }).populate('freelancer', 'name').populate('reviewee', 'name');
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};