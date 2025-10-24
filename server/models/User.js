const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Client', 'Freelancer'] },
    dob: { type: Date },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    phone: { type: String },
    companyName: { type: String },
    headline: { type: String },
    date: { type: Date, default: Date.now },
    // 2FA Fields
    twoFactorEnabled: { type: Boolean, default: false },
    oneTimeCode: { type: String },
    oneTimeCodeExpires: { type: Date },
    oneTimeCodeAttempts: { type: Number, default: 0 },
    oneTimeCodeLockedUntil: { type: Date },
    
    // --- ADD THESE TWO FIELDS FOR PASSWORD RESET ---
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);