const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Function to generate a new token
const signToken = (user) => {
    const payload = { 
        user: { 
            id: user.id, 
            role: user.role, 
            name: user.name,
            username: user.username
        } 
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// @desc    Update user password
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user's full details (for pre-filling forms)
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update all user details
exports.updateDetails = async (req, res) => {
    // Destructure all possible fields from the body
    const { 
        name, email, username, dob, country, state, city, phone, companyName, headline 
    } = req.body;

    try {
        const user = await User.findById(req.user.id);

        // Update basic info
        if (name) user.name = name;
        if (dob) user.dob = dob;
        if (phone) user.phone = phone;

        // Update role-specific info
        if (user.role === 'Client' && companyName) user.companyName = companyName;
        if (user.role ==='Freelancer' && headline) user.headline = headline;

        // Update location
        if (country) user.country = country;
        if (state) user.state = state;
        if (city) user.city = city;

        // Check and update email
        if (email && email.toLowerCase() !== user.email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({ msg: 'Email is already in use' });
            }
            user.email = email.toLowerCase();
        }
        
        // Check and update username
        if (username && username.toLowerCase() !== user.username) {
            const existingUsername = await User.findOne({ username: username.toLowerCase() });
            if (existingUsername) {
                return res.status(400).json({ msg: 'Username is already taken' });
            }
            user.username = username.toLowerCase();
        }

        await user.save();
        
        // Send back a new token with the updated name/username
        const token = signToken(user);
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};