// server/models/Gig.js
const mongoose = require('mongoose');

const GigSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Open', 'In Progress', 'Completed', 'Cancelled'], 
        default: 'Open' 
    },
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gig', GigSchema);