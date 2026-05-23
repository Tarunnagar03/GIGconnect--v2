const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    
    isClientFeedback: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);