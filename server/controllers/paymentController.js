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

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction'); // Import the Transaction model

async function applySuccessfulPaymentIntent(paymentIntent) {
    // idempotent transaction insert
    await Transaction.updateOne(
        { stripePaymentIntentId: paymentIntent.id },
        {
            $setOnInsert: {
                user: paymentIntent.metadata.userId,
                gig: paymentIntent.metadata.gigId,
                amount: paymentIntent.amount / 100,
                type: 'payment',
                status: 'successful',
                stripePaymentIntentId: paymentIntent.id,
            }
        },
        { upsert: true }
    );

    const gig = await Gig.findById(paymentIntent.metadata.gigId);
    if (!gig) return;

    const paidAmount = paymentIntent.amount / 100;
    gig.paidAmount = Number(gig.paidAmount || 0) + paidAmount;

    const idxStr = paymentIntent.metadata.milestoneIndex;
    if (idxStr !== undefined && idxStr !== null) {
        const idx = Number(idxStr);
        if (Array.isArray(gig.milestones) && gig.milestones[idx]) {
            gig.milestones[idx].status = 'paid';
            gig.milestones[idx].stripePaymentIntentId = paymentIntent.id;
        }
        gig.paymentStatus = gig.paidAmount >= gig.budget ? 'paid' : 'partially_paid';
    } else {
        gig.paymentStatus = 'paid';
        gig.paidAmount = gig.budget;
    }

    await gig.save();
}

// @desc    Create a Stripe payment intent
exports.createPaymentIntent = async (req, res) => {
    const { gigId, milestoneIndex } = req.body;

    try {
        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ msg: 'Gig not found' });
        }
        if (gig.client?.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to pay for this gig' });
        }

        let amountToCharge = gig.budget;
        let metadata = {
            gigId: gigId.toString(),
            userId: req.user.id
        };

        if (Number.isInteger(milestoneIndex) || typeof milestoneIndex === 'number') {
            const idx = Number(milestoneIndex);
            const milestone = Array.isArray(gig.milestones) ? gig.milestones[idx] : undefined;
            if (!milestone) return res.status(400).json({ msg: 'Invalid milestone' });
            if (milestone.status === 'paid') return res.status(400).json({ msg: 'Milestone already paid' });
            amountToCharge = milestone.amount;
            metadata.milestoneIndex = String(idx);
        } else if (gig.paymentStatus === 'paid') {
            return res.status(400).json({ msg: 'Gig already paid' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amountToCharge * 100), // For INR, this is in paise (₹1 = 100 paise)
            currency: 'inr', // Changed from usd to inr to support UPI, NetBanking, and Indian Cards
            description: `GigConnect Escrow Payment - Gig ID: ${gigId}`, // Description is required for Indian regulations
            automatic_payment_methods: {
                enabled: true,
            },
            // Add metadata to link this payment to our app's data
            metadata
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
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
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (!pi?.metadata?.gigId || !pi?.metadata?.userId) {
            return res.status(400).json({ msg: 'Invalid payment intent metadata' });
        }
        if (pi.metadata.userId !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        if (pi.status !== 'succeeded') {
            return res.status(400).json({ msg: `Payment not successful (status=${pi.status})` });
        }

        await applySuccessfulPaymentIntent(pi);
        res.json({ msg: 'Payment confirmed', gigId: pi.metadata.gigId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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
            await applySuccessfulPaymentIntent(paymentIntent);
        } catch (dbErr) {
            console.error("Database error saving transaction:", dbErr);
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
};