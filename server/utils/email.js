const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter (the service that sends the email)
    // We are using Gmail as an example.
    const transporter = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
            user: process.env.EMAIL_USER, // Your email address from .env
            pass: process.env.EMAIL_PASS  // Your email app-password from .env
        }
    });

    // 2. Define the email options
    const mailOptions = {
        from: 'GigConnect <no-reply@gigconnect.com>',
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;