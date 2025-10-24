const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updatePassword, updateDetails, getUserDetails } = require('../controllers/userController');

// @route   GET api/users/me
// @desc    Get current user's full details
router.get('/me', auth, getUserDetails);

// @route   PUT api/users/update-password
router.put('/update-password', auth, updatePassword);

// @route   PUT api/users/update-details
router.put('/update-details', auth, updateDetails);

module.exports = router;