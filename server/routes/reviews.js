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