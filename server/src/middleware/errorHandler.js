const mongoose = require('mongoose');
const multer = require('multer');
const env = require('../config/env');
const { ApiError } = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Please fix the highlighted fields';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err && err.code === 11000) {
    status = 409;
    message = err.keyPattern && err.keyPattern.email ? 'An account with this email already exists' : 'Duplicate request';
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 2 MB or smaller' : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can upload up to 4 images at a time' : 'Upload failed';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  }

  if (status >= 500) {
    if (!env.isTest) console.error('[error]', err);
    // Never leak internals in production.
    if (env.isProduction) {
      message = 'Something went wrong on our side. Please try again.';
      details = undefined;
    }
  }

  res.status(status).json({ success: false, message, ...(details ? { errors: details } : {}) });
}

module.exports = { notFound, errorHandler };
