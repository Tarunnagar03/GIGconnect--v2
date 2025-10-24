const sendEmail = require('../utils/email');

exports.handleContactForm = async (req, res) => {
    const { name, email, message } = req.body;

    // --- UPDATED VALIDATION ---
    // Only name and email are mandatory
    if (!name || !email) {
        return res.status(400).json({ msg: 'Name and email are required fields.' });
    }

    try {
        const emailHTML = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message || 'No message provided.'}</p> {/* Handle optional message */}
        `;

        await sendEmail({
            email: process.env.EMAIL_USER, // Sends the email to YOU
            subject: `New Contact Form Message from ${name}`,
            html: emailHTML
        });

        res.status(200).json({ msg: 'Message sent successfully!' });
    } catch (err) {
        console.error('Error sending contact email:', err);
        res.status(500).send('Server error while sending message.');
    }
};