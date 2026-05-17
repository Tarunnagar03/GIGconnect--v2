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

function normalizeStringArray(value) {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
    return undefined;
}

// Create a new gig
exports.createGig = async (req, res) => {
    const { title, description, budget, skills, locationText, geo, milestones } = req.body;
    try {
        const gigPayload = { title, description, budget, client: req.user.id, locationText };

        const skillsArr = normalizeStringArray(skills);
        if (skillsArr) gigPayload.skills = skillsArr;

        if (geo && typeof geo === 'object') {
            const lng = Array.isArray(geo.coordinates) ? Number(geo.coordinates[0]) : undefined;
            const lat = Array.isArray(geo.coordinates) ? Number(geo.coordinates[1]) : undefined;
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
                gigPayload.geo = { type: 'Point', coordinates: [lng, lat] };
            }
        }

        if (Array.isArray(milestones) && milestones.length) {
            gigPayload.milestones = milestones
                .filter(m => m && m.title && Number(m.amount) > 0)
                .map(m => ({ title: String(m.title), amount: Number(m.amount) }));
        }

        const newGig = new Gig(gigPayload);
        const gig = await newGig.save();
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

// --- THIS FUNCTION IS CORRECTED ---
// Get all gigs with filtering (Filters for 'Open' status)
exports.getAllGigs = async (req, res) => {
    try {
        const { keyword, minPrice, maxPrice, skills, lng, lat, radiusKm } = req.query;
        let query = {};
        const andConditions = [];

        if (keyword) {
            andConditions.push({
                $or: [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ]
            });
        }
        if (minPrice) {
            andConditions.push({ budget: { $gte: Number(minPrice) } });
        }
        if (maxPrice) {
            andConditions.push({ budget: { $lte: Number(maxPrice) } });
        }

        const skillsArr = normalizeStringArray(skills);
        if (skillsArr?.length) {
            andConditions.push({ skills: { $in: skillsArr } });
        }

        const hasGeo = Number.isFinite(Number(lng)) && Number.isFinite(Number(lat)) && Number.isFinite(Number(radiusKm));
        if (hasGeo) {
            andConditions.push({
                geo: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                        $maxDistance: Number(radiusKm) * 1000
                    }
                }
            });
        }

        // --- ENSURE THIS FILTER IS PRESENT ---
        andConditions.push({ status: 'Open' }); // Only find gigs that are Open

        query = { $and: andConditions };

        const gigs = await Gig.find(query)
                             .populate('client', ['name'])
                             .sort({ date: -1 });
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
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.client.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
        if (gig.status !== 'Open') return res.status(400).json({ msg: 'Gig is not open for assignment' });

        const updatedGig = await Gig.findByIdAndUpdate(gig._id, {
            $set: { assignedFreelancer: req.body.freelancerId, status: 'In Progress' }
        }, { new: true }).populate('assignedFreelancer', 'name username');
        
        res.json(updatedGig);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark a gig as complete
exports.completeGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.client.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
        if (gig.status !== 'In Progress') return res.status(400).json({ msg: 'Gig must be In Progress to be completed' });

        const updatedGig = await Gig.findByIdAndUpdate(gig._id, {
            $set: { status: 'Completed' }
        }, { new: true });
        res.json(updatedGig);
    } catch (err) {
        console.error("Complete Gig error:", err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// Revert a completed gig back to In Progress
exports.revertCompleteGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) return res.status(404).json({ msg: 'Gig not found' });
        if (gig.client.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
        if (gig.status !== 'Completed') return res.status(400).json({ msg: 'Gig is not in Completed status' });

        const updatedGig = await Gig.findByIdAndUpdate(gig._id, {
            $set: { status: 'In Progress' }
        }, { new: true });
        res.json(updatedGig);
    } catch (err) {
        console.error("Revert Gig error:", err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// Get gigs assigned to or completed by the logged-in freelancer
exports.getMyAssignedGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({
            assignedFreelancer: req.user.id,
            status: { $in: ['In Progress', 'Completed'] }
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
        const gigs = await Gig.find({ status: 'Open' })
            .populate('client', 'name')
            .sort({ date: -1 })
            .limit(4); // Get the 4 newest open gigs
        res.json(gigs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};