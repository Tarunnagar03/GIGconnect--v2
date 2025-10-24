const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateEmailCode, verifyAndEnableTwoFactor, disableTwoFactor } = require('../controllers/twoFactorController');

router.post('/generate-email-code', auth, generateEmailCode);
router.post('/verify', auth, verifyAndEnableTwoFactor);
router.put('/disable', auth, disableTwoFactor);

module.exports = router;