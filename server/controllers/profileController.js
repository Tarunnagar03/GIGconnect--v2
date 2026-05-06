/**
 * Profile Controller
 * UPDATED: May 6, 2026 - Freelancer Profile Management Enhancement
 * 
 * Manages:
 * - Freelancer profile creation and updates
 * - Skills management
 * - Hourly rate configuration
 * - Portfolio management
 * - Profile visibility and settings
 * - Rating and review statistics
 * - Profile search and discovery
 */

const Profile = require('../models/Profile');
const User = require('../models/User');

function normalizeStringArray(value) {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
    return undefined;
}

// @desc    Get current user's profile
exports.getCurrentProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'username']);
        if (!profile) {
            return res.status(404).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create or update user profile
exports.createOrUpdateProfile = async (req, res) => {
    // --- UPDATED: Destructure new fields ---
    const { skills, portfolio, rate, bio, services, education, achievements, locationText, geo } = req.body;
    
    // --- UPDATED: Add new fields to profileFields object ---
    const profileFields = { 
        user: req.user.id, 
        portfolio, 
        rate, 
        bio,
        locationText
    };

    // Handle arrays (we'll save them from comma-separated strings)
    const skillsArr = normalizeStringArray(skills);
    const servicesArr = normalizeStringArray(services);
    const educationArr = normalizeStringArray(education);
    const achievementsArr = normalizeStringArray(achievements);
    if (skillsArr) profileFields.skills = skillsArr;
    if (servicesArr) profileFields.services = servicesArr;
    if (educationArr) profileFields.education = educationArr;
    if (achievementsArr) profileFields.achievements = achievementsArr;

    if (geo && typeof geo === 'object') {
        const lng = Array.isArray(geo.coordinates) ? Number(geo.coordinates[0]) : undefined;
        const lat = Array.isArray(geo.coordinates) ? Number(geo.coordinates[1]) : undefined;
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
            profileFields.geo = { type: 'Point', coordinates: [lng, lat] };
        }
    }

    try {
        let profile = await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true, upsert: true }
        );
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Search freelancer profiles (skills/rate/rating + optional radius)
// @route   GET api/profiles/search
exports.searchProfiles = async (req, res) => {
    try {
        const {
            skills,
            minRate,
            maxRate,
            minRating,
            lng,
            lat,
            radiusKm,
            sort
        } = req.query;

        const andConditions = [];

        const skillsArr = normalizeStringArray(skills);
        if (skillsArr?.length) {
            andConditions.push({ skills: { $in: skillsArr } });
        }
        if (minRate) andConditions.push({ rate: { $gte: Number(minRate) } });
        if (maxRate) andConditions.push({ rate: { $lte: Number(maxRate) } });
        if (minRating) andConditions.push({ ratingAvg: { $gte: Number(minRating) } });

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

        const query = andConditions.length ? { $and: andConditions } : {};

        let mongooseQuery = Profile.find(query).populate('user', ['name', 'username', 'role', 'city', 'state', 'country']);
        if (sort === 'rate_asc') mongooseQuery = mongooseQuery.sort({ rate: 1 });
        else if (sort === 'rate_desc') mongooseQuery = mongooseQuery.sort({ rate: -1 });
        else if (sort === 'rating_desc') mongooseQuery = mongooseQuery.sort({ ratingAvg: -1, ratingCount: -1 });
        else mongooseQuery = mongooseQuery.sort({ ratingAvg: -1, ratingCount: -1, date: -1 });

        const profiles = await mongooseQuery.limit(50);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get profile by user ID
exports.getProfileByUserId = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.userId }).populate('user', ['name', 'username', 'role']);
        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Delete profile ONLY
exports.deleteProfileOnly = async (req, res) => {
    try {
        await Profile.findOneAndDelete({ user: req.user.id });
        res.json({ msg: 'Freelancer profile deleted. Your user account is still active.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete profile & user account (Permanent)
exports.deleteAccount = async (req, res) => {
    try {
        await Profile.findOneAndDelete({ user: req.user.id });
        await User.findOneAndDelete({ _id: req.user.id });
        res.json({ msg: 'User account permanently deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};