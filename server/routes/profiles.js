const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    getCurrentProfile, 
    createOrUpdateProfile, 
    deleteAccount,
    getProfileByUserId,
    deleteProfileOnly // <-- IMPORT THE NEW FUNCTION
} = require('../controllers/profileController');

// @route   GET api/profiles/me
// @desc    Get current user's profile
router.get('/me', auth, getCurrentProfile);

// @route   POST api/profiles
// @desc    Create or update user profile
router.post('/', auth, createOrUpdateProfile);

// @route   DELETE api/profiles/me
// @desc    Delete profile & user account
router.delete('/me', auth, deleteAccount); // This deletes the whole account

// --- THIS IS THE NEW ROUTE ---
// @route   DELETE api/profiles
// @desc    Delete profile ONLY
router.delete('/', auth, deleteProfileOnly); // This deletes just the profile

// @route   GET api/profiles/user/:userId
// @desc    Get profile by user ID (public)
router.get('/user/:userId', auth, getProfileByUserId);

module.exports = router;