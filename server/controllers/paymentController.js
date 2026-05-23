/**
 * Payment Controller
 * UPDATED: May 6, 2026 - Payment Processing Enhancement
 * 
 * Manages:
 * - Stripe payment integration
 * - Payment intent creation
 * - Transaction recording
 * - Milestone payments
 * - Payment history
 * - Invoice generation
 * - Refund handling
 */

const paymentService = require('../services/paymentService');
const payoutService = require('../services/payoutService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create a Stripe payment intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const result = await paymentService.createPaymentIntent(req.user.id, req.body);
        res.send(result);
    } catch (err) {
            console.error("Payment Intent Error:", err);
            res.status(400).json({ msg: err.message || 'Failed to create payment intent' });
    }
};

// @desc    Confirm a Stripe payment intent after client-side success (fallback for dev)
exports.confirmPaymentIntent = async (req, res) => {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ msg: 'Missing paymentIntentId' });

    try {
        await paymentService.confirmPayment(paymentIntentId, req.user.id);
        res.json({ msg: 'Payment confirmed' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ msg: err.message || 'Failed to confirm payment' });
    }
};

// @desc    Stripe webhook to listen for successful payments
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    // You must set up a webhook secret in your Stripe dashboard
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!', paymentIntent);

        // Create a transaction record in our database
        try {
            await paymentService.applySuccessfulPaymentIntent(paymentIntent);
        } catch (dbErr) {
            console.error("Database error saving transaction:", dbErr);
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
};

// @desc    Setup Stripe Connect Express Account for Freelancers
exports.setupStripeConnect = async (req, res) => {
    try {
        // Moved to payout service or payment service
        const url = await payoutService.setupStripeConnect(req.user.id, req.headers.origin);
        res.json({ url });
    } catch (err) {
        console.error("Stripe Connect Setup Error:", err);
        res.status(500).json({ msg: err.message || 'Failed to setup Stripe Connect' });
    }
};

// @desc    Request a Stripe Payout to connected bank account
exports.requestPayout = async (req, res) => {
    try {
        const result = await payoutService.processPayout(req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Payout Error:', err);
        res.status(500).json({ msg: err.message || 'Failed to process payout' });
    }
};