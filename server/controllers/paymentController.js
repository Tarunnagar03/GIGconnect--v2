const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction'); // Import the Transaction model

// @desc    Create a Stripe payment intent
exports.createPaymentIntent = async (req, res) => {
    const { gigId } = req.body;

    try {
        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ msg: 'Gig not found' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: gig.budget * 100, // Amount in cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            // Add metadata to link this payment to our app's data
            metadata: {
                gigId: gigId.toString(),
                userId: req.user.id
            }
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
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
            await new Transaction({
                user: paymentIntent.metadata.userId,
                gig: paymentIntent.metadata.gigId,
                amount: paymentIntent.amount / 100, // Convert back from cents
                type: 'payment',
                status: 'successful',
                stripePaymentIntentId: paymentIntent.id,
            }).save();
        } catch (dbErr) {
            console.error("Database error saving transaction:", dbErr);
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
};