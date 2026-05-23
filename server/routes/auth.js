const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    verifyLogin2FA,
    logout,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST api/auth/login/verify-2fa
// @desc    Verify 2FA code for login
// @access  Public
router.post('/login/verify-2fa', verifyLogin2FA);

// @route   POST api/auth/logout
// @desc    Log user out
// @access  Public (clears cookie)
router.post('/logout', logout);

// @route   POST api/auth/forgot-password
// @desc    Send password reset code
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   PUT api/auth/reset-password
// @desc    Reset password with code
// @access  Public
router.put('/reset-password', resetPassword);

module.exports = router;