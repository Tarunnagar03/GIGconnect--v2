// server/routes/contact.js
const express = require('express');
const router = express.Router();
const { handleContactForm } = require('../controllers/contactController');

// @route   POST api/contact
// @desc    Handle public contact form submission
router.post('/', handleContactForm);

module.exports = router;