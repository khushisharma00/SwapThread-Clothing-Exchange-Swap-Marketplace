const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function cookieOptions() {
  return {
    httpOnly: true, // not readable by JavaScript → mitigates token theft via XSS
    secure: env.isProduction, // HTTPS-only cookie in production
    sameSite: 'lax', // blocks the cookie on cross-site POSTs (CSRF mitigation)
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return readCookie(req, env.COOKIE_NAME);
}

async function loadUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Your session has expired, please log in again' : 'Invalid session, please log in again');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.status === 'suspended') throw ApiError.forbidden('This account has been suspended. Contact support.');
  // Track activity (throttled to once per 5 minutes) for the "active users" KPI.
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 5 * 60 * 1000) {
    User.updateOne({ _id: user._id }, { lastActiveAt: new Date() }).catch(() => {});
  }
  return user;
}

const requireAuth = async (req, res, next) => {
  try {
    const user = await loadUser(req);
    if (!user) throw ApiError.unauthorized();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Attaches req.user when a valid session exists, but never blocks the request. */
const optionalAuth = async (req, res, next) => {
  try {
    req.user = await loadUser(req);
  } catch {
    req.user = null;
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Administrator access required'));
  next();
};

module.exports = { requireAuth, optionalAuth, requireAdmin, signToken, cookieOptions };
