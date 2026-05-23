const User = require('../models/User');
const sendEmail = require('../utils/email');

const crypto = require('crypto');

exports.generateEmailCode = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const code = crypto.randomInt(100000, 999999).toString();

        user.oneTimeCode = code;
        user.oneTimeCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const emailHTML = `<p>Your GigConnect verification code is: <strong>${code}</strong></p>`;
        await sendEmail({ email: user.email, subject: 'Your 2FA Verification Code', html: emailHTML });

        res.json({ msg: 'A verification code has been sent to your email.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error. Could not send email.');
    }
};

exports.verifyAndEnableTwoFactor = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user.oneTimeCode || user.oneTimeCodeExpires < Date.now() || token !== user.oneTimeCode) {
            return res.status(400).json({ msg: 'Code is invalid or has expired.' });
        }

        user.twoFactorEnabled = true;
        user.oneTimeCode = undefined;
        user.oneTimeCodeExpires = undefined;
        await user.save();

        res.json({ msg: 'Two-Factor Authentication has been enabled!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.disableTwoFactor = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.twoFactorEnabled = false;
        await user.save();
        res.json({ msg: 'Two-Factor Authentication has been disabled.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};