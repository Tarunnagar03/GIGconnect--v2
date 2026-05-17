const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

exports.handleContactForm = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ msg: 'Name and Email are required.' });
    }

    try {
        // TareeKa 1: Message ko pehle MongoDB Database mein save karein
        const newContact = new Contact({ name, email, message });
        await newContact.save();

        // Tareeka 2: Message ko Email ke through Admin ko send karein
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_USER, // Yeh email Admin (.env wale) ko jayegi
                    replyTo: email, // Taaki Admin direct reply kare toh user ko jaye
                    subject: `GigConnect: New Contact Request from ${name}`,
                    text: `You have received a new message!\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message || 'No message provided.'}`
                };

                await transporter.sendMail(mailOptions);
            } catch (emailErr) {
                console.error('Email sending failed, but message saved to DB:', emailErr.message);
                // Yahan hum error throw nahi karenge, taaki user ko success message mil sake
            }
        }

        res.status(200).json({ msg: 'Message sent successfully! We will get back to you soon.' });
    } catch (err) {
        console.error('Contact Form Error:', err);
        res.status(500).json({ msg: 'Failed to send message. Please check server logs.' });
    }
};