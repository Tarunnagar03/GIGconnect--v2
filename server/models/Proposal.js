// server/models/Proposal.js
const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Submitted', 'Accepted', 'Rejected', 'Withdrawn'],
        default: 'Submitted'
    },
    // --- FIELD ADDED ---
    rejectionReason: { type: String } // Store the reason for rejection
}, { timestamps: true });

module.exports = mongoose.model('Proposal', ProposalSchema);