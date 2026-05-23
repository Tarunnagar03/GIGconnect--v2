// server/routes/contact.js
const express = require('express');
const router = express.Router();
const { handleContactForm, getMyTickets } = require('../controllers/contactController');
const auth = require('../middleware/auth');

// @route   POST api/contact
// @desc    Handle public contact form submission
router.post('/', handleContactForm);

// @route   GET api/contact/my-tickets
// @desc    Get user's support tickets
router.get('/my-tickets', auth, getMyTickets);

module.exports = router;