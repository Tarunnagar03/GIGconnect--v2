/**
 * Profiles Routes
 * UPDATED: May 6, 2026 - Freelancer Profile Management Enhancement
 * 
 * Endpoints:
 * - POST /create: Create freelancer profile
 * - GET /my-profile: Get current freelancer's profile
 * - GET /:userId/profile: Get specific user's profile
 * - PUT /update: Update freelancer profile
 * - GET /find-freelancers: Search for freelancers by skills/location
 * - DELETE /delete: Delete freelancer profile
 * 
 * Requires: Authentication middleware
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    getCurrentProfile, 
    createOrUpdateProfile, 
    deleteAccount,
    getProfileByUserId,
    searchProfiles,
    deleteProfileOnly // <-- IMPORT THE NEW FUNCTION
} = require('../controllers/profileController');

// @route   GET api/profiles/me
// @desc    Get current user's profile
router.get('/me', auth, getCurrentProfile);

// @route   GET api/profiles/search
// @desc    Search freelancer profiles (skills/location/rate/rating)
router.get('/search', auth, searchProfiles);

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