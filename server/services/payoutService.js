const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeConnect(userId, origin) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    let accountId = user.stripeAccountId;
    
    if (!accountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            email: user.email,
            capabilities: { transfers: { requested: true } },
        });
        accountId = account.id;
        user.stripeAccountId = accountId;
        await user.save();
    }

    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/settings/billing?refresh=true`,
        return_url: `${origin}/settings/billing?success=true`,
        type: 'account_onboarding',
    });

    return accountLink.url;
}

async function processPayout(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found');
        if (!user.stripeAccountId) throw new Error('Stripe account not connected. Please set up payouts in Billing Settings.');
        if (user.walletBalance <= 0) throw new Error('Insufficient balance to withdraw.');

        const lockedUser = await User.findOneAndUpdate(
            { _id: userId, walletBalance: { $gt: 0 } },
            { $set: { walletBalance: 0 } },
            { new: false, session } 
        );
        if (!lockedUser) throw new Error('Race condition prevented: Balance already withdrawn or locked.');

        const payoutAmount = lockedUser.walletBalance;
        const tx = await Transaction.create([{ user: lockedUser._id, amount: payoutAmount, type: 'payout', status: 'pending' }], { session });
        const payout = await stripe.transfers.create({ amount: Math.round(payoutAmount * 100), currency: 'inr', destination: user.stripeAccountId }, { idempotencyKey: `payout_${tx[0]._id.toString()}` });

        tx[0].status = 'successful';
        await tx[0].save({ session });
        await session.commitTransaction();
        session.endSession();
        return { msg: 'Payout successful! Funds are on the way to your bank account.', payout };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = { processPayout, setupStripeConnect };