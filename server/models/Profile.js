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
    achievements: { type: [String] }
});

module.exports = mongoose.model('Profile', ProfileSchema);