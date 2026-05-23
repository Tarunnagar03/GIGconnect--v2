const Contact = require('../models/Contact');
const User = require('../models/User');
const sendEmail = require('../utils/email');

exports.handleContactForm = async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ msg: 'Name and Email are required.' });
    }

    try {
            // Step 1: Save the message to the MongoDB Database
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

            // Step 2: Send the message via Email to the Admin
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await sendEmail({
                    email: process.env.EMAIL_USER,
                    subject: `[${subject || 'Inquiry'}] New Request from ${name} - GigConnect`,
                    html: `<h3>You have received a new message!</h3><p><b>Name:</b> ${name}<br><b>Email:</b> ${email}<br><b>Category:</b> ${subject || 'General Inquiry'}</p><p><b>Message:</b><br>${message || 'No message provided.'}</p>`
                });
            } catch (emailErr) {
                    console.error('Email sending failed, but message saved to DB:', emailErr.message);
                    // Do not throw an error here to ensure the user receives a success message
            }
        }

        res.status(200).json({ msg: 'Message sent successfully! We will get back to you soon.' });
    } catch (err) {
        console.error('Contact Form Error:', err);
        res.status(500).json({ msg: 'Failed to send message. Please check server logs.' });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const tickets = await Contact.find({ email: user.email }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error("Error fetching tickets:", err.message);
        res.status(500).send('Server Error');
    }
};

// --- NEW: Admin Delete Contact Message ---
exports.deleteContactMessage = async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: 'Contact message deleted successfully.' });
    } catch (err) {
        console.error('Delete Contact Error:', err);
        res.status(500).json({ msg: 'Failed to delete message.' });
    }
};