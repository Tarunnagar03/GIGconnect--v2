/**
 * User Model
 * UPDATED: May 6, 2026 - User Management Enhancement
 * 
 * Stores:
 * - User authentication details (email, password)
 * - User profile information
 * - User role (client/freelancer/admin)
 * - Account security settings (2FA)
 * - Location information
 * - Account status and timestamps
 * - User preferences
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Keep existing roles; add Admin for dashboard capabilities.
    // NOTE: We do not expose Admin creation via public signup endpoints.
    role: { type: String, required: true, enum: ['Client', 'Freelancer', 'Admin'] },
    dob: { type: Date },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    // Geospatial data for hyperlocal search (stores longitude & latitude)
    geo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined } // [lng, lat]
    },
    phone: { type: String },
    companyName: { type: String },
    headline: { type: String },
    profileImage: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    
    // Enterprise Feature: Trust & Safety KYC
    kycStatus: { 
        type: String, 
        enum: ['Unverified', 'Pending', 'Verified', 'Rejected'], 
        default: 'Unverified' 
    },

    // Enterprise Feature: Stripe Connect (Payouts & Escrow)
    stripeAccountId: { type: String },
    stripeAccountSetupComplete: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },

    // 2FA Fields
    twoFactorEnabled: { type: Boolean, default: false },
    oneTimeCode: { type: String },
    oneTimeCodeExpires: { type: Date },
    oneTimeCodeAttempts: { type: Number, default: 0 },
    oneTimeCodeLockedUntil: { type: Date },
    
    // --- ADD THESE TWO FIELDS FOR PASSWORD RESET ---
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },

    // Admin can soft-disable accounts (safer than delete).
    isActive: { type: Boolean, default: true }
});

// Enable MongoDB geospatial queries for finding users near a specific location
UserSchema.index({ geo: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);