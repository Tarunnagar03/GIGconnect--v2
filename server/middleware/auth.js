// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

module.exports = async function (req, res, next) {
    // SECURE FIX: Read token from HttpOnly cookie first, fallback to Authorization header
    let token = req.cookies?.token || req.header('Authorization');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Standard: "Bearer <token>"
    if (token.startsWith('Bearer ')) {
        token = token.substring(7, token.length);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // --- REAL-TIME BAN CHECK ---
        const user = await User.findById(decoded.user.id).select('isActive');
        if (!user || user.isActive === false) {
            return res.status(403).json({ msg: 'Account suspended. Please contact support to regain access.' });
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};