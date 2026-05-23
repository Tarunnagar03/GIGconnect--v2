/**
 * Gig Controller
 * UPDATED: May 6, 2026 - Gig Management Enhancement
 * 
 * Manages:
 * - Gig CRUD operations (Create, Read, Update, Delete)
 * - Gig search and filtering
 * - Location-based gig queries (geospatial)
 * - Gig status management
 * - Gig proposals and bidding
 * - Freelancer assignment
 * - Gig completion handling
 */

// server/controllers/gigController.js
const Gig = require('../models/Gig');
const gigService = require('../services/gigService');
const jwt = require('jsonwebtoken');

// Create a new gig
exports.createGig = async (req, res) => {
    try {
        const gig = await gigService.createGig(req.user.id, req.body);
        res.json(gig);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all gigs for the logged-in client
exports.getMyGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({ client: req.user.id }).sort({ date: -1 });
        res.json(gigs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all gigs with filtering (Filters for 'Open' status)
exports.getAllGigs = async (req, res) => {
    try {
        const { keyword, minPrice, maxPrice, skills, lng, lat, radiusKm, recommendations } = req.query;

        if (recommendations === 'true') {
            let userId = req.user?.id;
            // Fallback to manual JWT decode if route isn't strictly authenticated
            if (!userId && req.headers && req.headers.authorization) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    userId = decoded.user.id;
                } catch (e) {}
            }

            if (userId) {
                const recommendedGigs = await gigService.getRecommendedGigs(userId);
                return res.json(recommendedGigs);
            }
        }

        // Hand off to the Service Layer
        const gigs = await gigService.searchOpenGigs(req.query);
        res.json(gigs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get a single gig by its ID
exports.getGigById = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id)
                             .populate('client', ['name', 'username'])
                             .populate('assignedFreelancer', ['name', 'username']);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        res.json(gig);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Gig not found' });
        res.status(500).send('Server Error');
    }
};

// Assign a freelancer to a gig
exports.assignFreelancer = async (req, res) => {
    try {
        const updatedGig = await gigService.assignFreelancer(req.user.id, req.params.gigId, req.body.freelancerId);
        res.json(updatedGig);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
    }
};

// Mark a gig as complete
exports.completeGig = async (req, res) => {
    try {
        const updatedGig = await gigService.completeGig(req.user.id, req.params.gigId);
        res.json(updatedGig);
    } catch (err) {
        console.error("Complete Gig error:", err);
        res.status(500).json({ msg: err.message || 'Server Error' });
        res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
    }
};

// Revert a completed gig back to In Progress
exports.revertCompleteGig = async (req, res) => {
    try {
        const updatedGig = await gigService.revertCompleteGig(req.user.id, req.params.gigId);
        res.json(updatedGig);
    } catch (err) {
        console.error("Revert Gig error:", err);
        res.status(500).json({ msg: err.message || 'Server Error' });
        res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
    }
};

// Get gigs assigned to or completed by the logged-in freelancer
exports.getMyAssignedGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({
            assignedFreelancer: req.user.id,
            status: { $in: ['In Progress', 'Completed', 'Disputed'] } // Show disputed gigs too
        }).sort({ date: -1 });
        res.json(gigs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- NEW FUNCTION: Get a few open gigs for the public landing page ---
exports.getPublicGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({ 
            status: 'Open',
            status: { $ne: 'Archived' } // Hide archived gigs
        })
            .populate('client', 'name')
            .sort({ date: -1 })
            .limit(4); // Get the 4 newest open gigs
        res.json(gigs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Submit a deliverable to a workspace
exports.submitDeliverable = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.assignedFreelancer.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
        
        const newDeliverable = {
            text: req.body.text,
            fileName: req.body.fileName,
            fileData: req.body.fileData,
            status: 'Pending Review',
            submittedAt: new Date()
        };

        gig.deliverables.unshift(newDeliverable);
        await gig.save();

        res.json(gig.deliverables);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Update deliverable status (Approve / Reject)
exports.updateDeliverableStatus = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.client.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

        const deliverable = gig.deliverables.id(req.params.deliverableId);
        if (!deliverable) return res.status(404).json({ msg: 'Deliverable not found' });

        deliverable.status = req.body.status;
        if (req.body.feedback) deliverable.feedback = req.body.feedback;

        await gig.save();
        res.json(gig.deliverables);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};