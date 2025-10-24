const Profile = require('../models/Profile');
const User = require('../models/User');

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
    const { skills, portfolio, rate, bio, services, education, achievements } = req.body;
    
    // --- UPDATED: Add new fields to profileFields object ---
    const profileFields = { 
        user: req.user.id, 
        portfolio, 
        rate, 
        bio 
    };

    // Handle arrays (we'll save them from comma-separated strings)
    if (skills) profileFields.skills = skills.split(',').map(skill => skill.trim());
    if (services) profileFields.services = services.split(',').map(item => item.trim());
    if (education) profileFields.education = education.split(',').map(item => item.trim());
    if (achievements) profileFields.achievements = achievements.split(',').map(item => item.trim());

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