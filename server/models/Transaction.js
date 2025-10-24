const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' }, // This links the transaction to a gig
    amount: { type: Number, required: true },
    type: { type: String, enum: ['payment', 'payout', 'refund'], required: true },
    status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
    stripePaymentIntentId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);