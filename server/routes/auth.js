const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    verifyLogin2FA,
    forgotPassword, // <-- ADDED
    resetPassword   // <-- ADDED
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login/verify-2fa', verifyLogin2FA);

// --- ADD THESE NEW ROUTES ---
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

module.exports = router;