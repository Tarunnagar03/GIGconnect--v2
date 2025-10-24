// server/models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }, // Comment is optional as per your request
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);