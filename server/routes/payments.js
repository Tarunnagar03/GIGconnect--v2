const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createPaymentIntent, stripeWebhook } = require('../controllers/paymentController');

// This route is for the user to create a payment
router.post('/create-payment-intent', auth, createPaymentIntent);

// This route is for Stripe to send us updates
// It uses express.raw() instead of express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;