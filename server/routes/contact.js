// server/routes/contact.js
const express = require('express');
const router = express.Router();
const { handleContactForm } = require('../controllers/contactController');
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const User = require('../models/User');

// @route   POST api/contact
// @desc    Handle public contact form submission
router.post('/', handleContactForm);

// @route   GET api/contact/my-tickets
// @desc    Get user's support tickets
router.get('/my-tickets', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const tickets = await Contact.find({ email: user.email }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error("Error fetching tickets:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;