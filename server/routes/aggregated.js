const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Gig = require('../models/Gig');
const Review = require('../models/Review');

// @route   GET /api/aggregated/about-me
// @desc    Get current user and profile data in a single call
router.get('/about-me', auth, async (req, res) => {
    try {
        const [user, profile] = await Promise.all([
            User.findById(req.user.id).select('-password').lean(),
            Profile.findOne({ user: req.user.id }).lean()
        ]);
        res.json({ user, profile });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/aggregated/client-profile/:id
// @desc    Get client user, profile, gigs, and reviews in a single call
router.get('/client-profile/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const [user, profile, gigs, reviews] = await Promise.all([
            User.findById(clientId).select('-password').lean(),
            Profile.findOne({ user: clientId }).lean(),
            Gig.find({ client: clientId }).sort({ date: -1 }).lean(),
            Review.find({ client: clientId, isClientFeedback: true }).populate('reviewer', 'name').lean()
        ]);
        res.json({ user, profile, gigs, reviews });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;