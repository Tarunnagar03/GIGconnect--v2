const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTransactionHistory } = require('../controllers/transactionController');

// @route   GET api/transactions/me
// @desc    Get all transactions for logged-in user
router.get('/me', auth, getTransactionHistory);

module.exports = router;