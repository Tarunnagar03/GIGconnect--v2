/**
 * Gig Model
 * UPDATED: May 6, 2026 - Gig Management Enhancement
 * 
 * Stores:
 * - Gig title and description
 * - Gig category and skills required
 * - Budget and payment information
 * - Location and geographic data
 * - Gig status (Open, In Progress, Completed, Closed)
 * - Client information
 * - Assigned freelancer details
 * - Proposals and bids
 * - Timestamps and lifecycle tracking
 * - Geospatial indexing for location-based queries
 */

// server/models/Gig.js
const mongoose = require('mongoose');

const GigSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    // Optional categorization for search/matching
    skills: { type: [String], default: [] },
    locationText: { type: String }, // e.g. "Andheri, Mumbai"
    geo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined } // [lng, lat]
    },
    status: { 
        type: String, 
        enum: ['Open', 'In Progress', 'Completed', 'Cancelled', 'Disputed'], 
        default: 'Open' 
    },
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Payments / milestones
    paymentStatus: { type: String, enum: ['unpaid', 'partially_paid', 'paid'], default: 'unpaid' },
    paidAmount: { type: Number, default: 0 },
    milestones: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true, min: 1 },
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        stripePaymentIntentId: { type: String }
    }],
    date: { type: Date, default: Date.now }
});

// Enterprise Full-Text Search Index for fast querying
GigSchema.index({ title: 'text', description: 'text' });
GigSchema.index({ geo: '2dsphere' });
GigSchema.index({ skills: 1, status: 1, budget: 1, date: -1 });

module.exports = mongoose.model('Gig', GigSchema);