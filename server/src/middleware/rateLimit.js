const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const passThrough = (req, res, next) => next();

/** 20 login/register attempts per 15 minutes per IP. Disabled in automated tests. */
const authLimiter = env.isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' },
    });

/** General API ceiling: 300 requests per minute per IP. */
const apiLimiter = env.isTest
  ? passThrough
  : rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Please slow down.' },
    });

module.exports = { authLimiter, apiLimiter };
