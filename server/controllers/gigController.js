// server/controllers/gigController.js
const Gig = require('../models/Gig');

// Create a new gig
exports.createGig = async (req, res) => {
    const { title, description, budget } = req.body;
    try {
        const newGig = new Gig({ title, description, budget, client: req.user.id });
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
        const { keyword, minPrice, maxPrice } = req.query;
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

        gig.assignedFreelancer = req.body.freelancerId;
        gig.status = 'In Progress';
        await gig.save();
        const updatedGig = await Gig.findById(gig._id).populate('assignedFreelancer', 'name username');
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

        gig.status = 'Completed';
        await gig.save();
        res.json(gig);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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