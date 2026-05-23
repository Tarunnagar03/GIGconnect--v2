const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const crypto = require('crypto'); // Import the built-in crypto module

const getAuditMeta = (req) => ({
    lastIpAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.socket?.remoteAddress || 'Unknown',
    lastUserAgent: req.headers['user-agent'] || 'Unknown',
    lastLogin: Date.now()
});

// Helper function to generate a 6-digit code
const generateCode = () => crypto.randomInt(100000, 1000000).toString();

// Safe fallback for JWT Secret during development
const JWT_SECRET = process.env.JWT_SECRET || 'gigconnect_default_secret_123';

// Helper configuration for cookies
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 3600000 // 1 hour
};

exports.registerUser = async (req, res) => {
    const { name, username, email, password, role, dob, country, state, city, phone, companyName, headline } = req.body;
    try {
        let userByEmail = await User.findOne({ email: email.toLowerCase() });
        if (userByEmail) return res.status(400).json({ msg: 'Email already exists' });
        
        let userByUsername = await User.findOne({ username: username.toLowerCase() });
        if (userByUsername) return res.status(400).json({ msg: 'Username is already taken' });

        const meta = getAuditMeta(req);
        const user = new User({
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            role, dob, country, state, city, phone, companyName, headline,
            lastIpAddress: meta.lastIpAddress, lastUserAgent: meta.lastUserAgent, lastLogin: meta.lastLogin
        });
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { 
            user: { 
                id: user.id, 
                role: user.role, 
                name: user.name, 
                username: user.username
            } 
        };
        
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error("JWT Error:", err);
                return res.status(500).json({ msg: 'Error generating token' });
            }
            res.cookie('token', token, cookieOptions).json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const loginIdentifier = email.toLowerCase();
        let user = await User.findOne({
          $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
        });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // --- NEW: Check if user account is active (not banned) ---
        if (user.isActive === false) {
            return res.status(403).json({ msg: 'Your account has been suspended. Please contact support to regain access.' });
        }

        const meta = getAuditMeta(req);
        user.lastIpAddress = meta.lastIpAddress;
        user.lastUserAgent = meta.lastUserAgent;
        user.lastLogin = meta.lastLogin;

        if (user.twoFactorEnabled) {
            const code = generateCode();
            user.oneTimeCode = code;
            user.oneTimeCodeExpires = Date.now() + 10 * 60 * 1000;
            await user.save();

            const emailHTML = `<p>Your GigConnect login code is: <strong>${code}</strong></p>`;
            await sendEmail({ email: user.email, subject: 'Your GigConnect Login Code', html: emailHTML });
            
            return res.json({ twoFactorRequired: true, userId: user.id });
        }

        await user.save();

        const payload = { 
            user: { 
                id: user.id, 
                role: user.role, 
                name: user.name, 
                username: user.username
            } 
        };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error("JWT Error:", err);
                return res.status(500).json({ msg: 'Error generating token' });
            }
            res.cookie('token', token, cookieOptions).json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};
exports.verifyLogin2FA = async (req, res) => {
    const { userId, token } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user || !user.oneTimeCode || user.oneTimeCodeExpires < Date.now() || token !== user.oneTimeCode) {
            return res.status(400).json({ msg: 'Invalid code or it has expired.' });
        }

        user.oneTimeCode = undefined;
        user.oneTimeCodeExpires = undefined;
        await user.save();

        const payload = { 
            user: { 
                id: user.id, 
                role: user.role, 
                name: user.name, 
                username: user.username
            } 
        };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, finalToken) => {
            if (err) {
                console.error("JWT Error:", err);
                return res.status(500).json({ msg: 'Error generating token' });
            }
            res.cookie('token', finalToken, cookieOptions).json({ token: finalToken });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

// --- FUNCTION: Logout user ---
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ msg: 'Logged out successfully' });
};

// --- NEW FUNCTION: Forgot Password (Send OTP) ---
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });
        if (!user) {
            return res.json({ msg: 'If a user with that email exists, a reset code has been sent.' });
        }

        const resetCode = generateCode();

        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const emailHTML = `
            <p>Your password reset code for GigConnect is: <strong>${resetCode}</strong></p>
            <p>This code will expire in 10 minutes.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Your GigConnect Password Reset Code',
            html: emailHTML
        });

        res.json({ msg: 'A password reset code has been sent to your email.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- NEW FUNCTION: Reset Password (Verify OTP and Update) ---
exports.resetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    try {
        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid code or it has expired. Please try again.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ msg: 'Password reset successful! You can now log in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};