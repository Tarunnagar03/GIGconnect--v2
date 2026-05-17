// server/routes/gigs.js
const express = require('express');
const router = express.Router();
const { 
    getPublicGigs,
    createGig, 
    getMyGigs, 
    getAllGigs, 
    getGigById, 
    assignFreelancer, 
    completeGig,
    getMyAssignedGigs,
    revertCompleteGig
} = require('../controllers/gigController');
const auth = require('../middleware/auth');

// --- Specific routes MUST come first ---

// @route   GET api/gigs/public
// @desc    Get a few open gigs for the landing page
router.get('/public', getPublicGigs);

// @route  POST api/gigs
// @desc   Create a gig
router.post('/', auth, createGig);

// @route  GET api/gigs
// @desc   Get all open gigs (for browsing)
router.get('/', auth, getAllGigs);

// @route  GET api/gigs/my-gigs
// @desc   Get gigs for the current client
router.get('/my-gigs', auth, getMyGigs);

// @route  GET api/gigs/my-assigned-gigs
// @desc   Get gigs assigned to the current freelancer
router.get('/my-assigned-gigs', auth, getMyAssignedGigs);


// --- The dynamic :id route MUST come LAST ---

// @route  GET api/gigs/:id
// @desc   Get a single gig by ID
router.get('/:id', auth, getGigById);


// --- PUT routes for actions ---

// @route  PUT api/gigs/assign/:gigId
// @desc   Assign a freelancer to a gig
router.put('/assign/:gigId', auth, assignFreelancer);

// @route  PUT api/gigs/complete/:gigId
// @desc   Mark a gig as complete
router.put('/complete/:gigId', auth, completeGig);

// @route  PUT api/gigs/revert-complete/:gigId
// @desc   Revert a completed gig back to In Progress
router.put('/revert-complete/:gigId', auth, revertCompleteGig);

module.exports = router;