/**
 * Review Model
 * UPDATED: May 6, 2026 - Review & Rating System Enhancement
 * 
 * Stores:
 * - Review rating (1-5 stars)
 * - Review text/comments
 * - Reviewer information
 * - Gig reference
 * - Reviewed user/profile
 * - Timestamp of review
 * - Review visibility and moderation status
 */

// server/models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    // Backward compatible fields (existing data + endpoints)
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Two-way feedback support (new fields; for old rows we infer roles)
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewerRole: { type: String, enum: ['Client', 'Freelancer'] },
    revieweeRole: { type: String, enum: ['Client', 'Freelancer'] },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }, // Comment is optional as per your request
}, { timestamps: true });

ReviewSchema.index({ gig: 1, reviewer: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ freelancer: 1, createdAt: -1 });
ReviewSchema.index({ client: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);