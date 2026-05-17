/**
 * Profile Model
 * UPDATED: May 6, 2026 - Freelancer Profile Enhancement
 * 
 * Stores:
 * - Freelancer information
 * - Skills array
 * - Hourly rate
 * - Biography and headline
 * - Portfolio and projects
 * - Certifications
 * - Availability status
 * - Average rating and review count
 * - User reference to User model
 */

const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    skills: { type: [String], required: true },
    portfolio: { type: String },
    rate: { type: Number },
    bio: { type: String },
    date: { type: Date, default: Date.now },

    // --- NEW FIELDS ---
    services: { type: [String] },
    education: { type: [String] },
    achievements: { type: [String] },

    // Hyperlocal search support (optional but recommended)
    locationText: { type: String }, // e.g. "Bengaluru, Karnataka"
    geo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined } // [lng, lat]
    },

    // Denormalized rating summary for fast filtering/sorting
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
});

ProfileSchema.index({ geo: '2dsphere' });
ProfileSchema.index({ skills: 1 });
ProfileSchema.index({ rate: 1 });
ProfileSchema.index({ ratingAvg: -1, ratingCount: -1 });

module.exports = mongoose.model('Profile', ProfileSchema);