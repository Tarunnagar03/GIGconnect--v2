/**
 * Reviews Routes
 * UPDATED: May 6, 2026 - Review & Rating System Enhancement
 * 
 * Endpoints:
 * - POST /submit-review: Submit a review for completed gig
 * - GET /gig/:gigId/reviews: Get reviews for a gig
 * - GET /user/:userId/reviews: Get reviews for a user
 * - GET /me/my-reviews: Get current user's submitted reviews
 * - DELETE /:reviewId: Delete a review
 * 
 * Requires: Authentication middleware for protected endpoints
 */

// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const {
  createReview,
  createClientFeedback,
  getClientReviews,
  getFreelancerReviews,
  getMyReviews
} = require('../controllers/reviewController');

// @route   POST api/reviews
// @desc    Create a review
router.post('/', auth, createReview);

// @route   POST api/reviews/client-feedback
// @desc    Freelancer feedback for client (two-way reviews)
router.post('/client-feedback', auth, createClientFeedback);

// --- NEW ROUTE: EDIT REVIEW ---
// @route   PUT api/reviews/:reviewId
// @desc    Edit an existing review
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ msg: 'Review not found' });
        
        if (review.reviewer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to edit this review' });
        }

        review.rating = req.body.rating || review.rating;
        review.comment = req.body.comment || review.comment;
        review.isEdited = true;
        await review.save();

        // Recalculate average rating for the target profile
        const targetUserId = review.isClientFeedback ? review.client : review.freelancer;
        const profile = await Profile.findOne({ user: targetUserId });
        
        if (profile) {
            const allReviews = await Review.find({ 
                [review.isClientFeedback ? 'client' : 'freelancer']: targetUserId,
                isClientFeedback: review.isClientFeedback 
            });
            const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
            profile.ratingAvg = Number(avg.toFixed(1));
            await profile.save();
        }

        res.json(review);
    } catch (err) {
        console.error('Edit Review Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- THIS ROUTE MUST COME FIRST ---
// @route   GET api/reviews/me/my-reviews
// @desc    Get all reviews written by the current user
router.get('/me/my-reviews', auth, getMyReviews);

// @route   GET api/reviews/client/:clientId
// @desc    Get feedback for a client
router.get('/client/:clientId', auth, getClientReviews);

// --- DYNAMIC ROUTES MUST COME LAST ---
// @route   GET api/reviews/:freelancerId
// @desc    Get all reviews for a freelancer
router.get('/:freelancerId', auth, getFreelancerReviews);

module.exports = router;