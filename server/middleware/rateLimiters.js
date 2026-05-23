const rateLimit = require('express-rate-limit');

exports.globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: { msg: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { msg: 'Too many authentication attempts, please try again after 15 minutes.' },
});

exports.twoFaLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: { msg: 'Too many 2FA requests, please try again after 10 minutes.' },
});

exports.paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: { msg: 'Too many payment requests, please try again after an hour.' },
});