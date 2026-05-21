/**
 * Payments Routes
 * UPDATED: May 6, 2026 - Payment Processing System Enhancement
 * 
 * Endpoints:
 * - POST /create-payment-intent: Create Stripe payment intent
 * - POST /process-payment: Process payment transaction
 * - GET /transaction-history: Get user transaction history
 * - GET /transaction/:id: Get specific transaction
 * 
 * Requires: Authentication middleware
 * Integrates: Stripe payment gateway
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createPaymentIntent, confirmPaymentIntent, stripeWebhook, setupStripeConnect, requestPayout } = require('../controllers/paymentController');

// This route is for the user to create a payment
router.post('/create-payment-intent', auth, createPaymentIntent);

router.post('/connect', auth, setupStripeConnect);

// Freelancer route to withdraw funds
router.post('/payout', auth, requestPayout);


// Fallback confirmation for local/dev demos (still verifies with Stripe API)
router.post('/confirm-payment-intent', auth, confirmPaymentIntent);

// This route is for Stripe to send us updates
// It uses express.raw() instead of express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;