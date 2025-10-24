// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createReview, getFreelancerReviews, getMyReviews } = require('../controllers/reviewController');

// @route   POST api/reviews
// @desc    Create a review
router.post('/', auth, createReview);

// --- THIS ROUTE MUST COME FIRST ---
// @route   GET api/reviews/me/my-reviews
// @desc    Get all reviews written by the current user
router.get('/me/my-reviews', auth, getMyReviews);

// --- DYNAMIC ROUTES MUST COME LAST ---
// @route   GET api/reviews/:freelancerId
// @desc    Get all reviews for a freelancer
router.get('/:freelancerId', auth, getFreelancerReviews);

module.exports = router;