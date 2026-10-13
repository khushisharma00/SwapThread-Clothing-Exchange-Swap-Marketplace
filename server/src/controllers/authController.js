const User = require('../models/User');
const env = require('../config/env');
const { findCity, cityNames } = require('../config/catalog');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody } = require('../utils/validate');
const { toGeoPoint } = require('../utils/geo');
const { signToken, cookieOptions } = require('../middleware/auth');

const PASSWORD_RULE = {
  type: 'string',
  required: true,
  min: 8,
  max: 72, // bcrypt only uses the first 72 bytes
  label: 'Password',
  pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
  patternMessage: 'Password must contain at least one letter and one number',
};

function sendSession(res, user, status = 200) {
  res.cookie(env.COOKIE_NAME, signToken(user), cookieOptions());
  res.status(status).json({ success: true, data: { user: user.toPrivate() } });
}

exports.register = asyncHandler(async (req, res) => {
  const data = validateBody(req.body, {
    name: { type: 'string', required: true, min: 2, max: 60, label: 'Name' },
    email: { type: 'email', required: true, label: 'Email' },
    password: PASSWORD_RULE,
    city: { type: 'enum', values: cityNames, label: 'City' },
  });

  const exists = await User.exists({ email: data.email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  // Role is ALWAYS "customer" here — admins are created only via the CLI script.
  const user = new User({ name: data.name, email: data.email, role: 'customer' });
  const city = findCity(data.city);
  if (city) {
    user.location = { city: city.name, state: city.state, area: '', showArea: false };
    user.geo = toGeoPoint(city);
  }
  await user.setPassword(data.password);
  await user.save();
  sendSession(res, user, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const data = validateBody(req.body, {
    email: { type: 'string', required: true, label: 'Email or Username' },
    password: { type: 'string', required: true, max: 200, label: 'Password' },
  });
  const input = data.email.trim().toLowerCase();

  let query = { email: input };
  if (input === 'admin') {
    query = {
      $or: [
        { email: 'admin' },
        { email: 'admin@swapthread.com' },
        { email: 'admin@rewear.test' },
        { name: 'admin' },
      ],
    };
  }

  let user = await User.findOne(query).select('+passwordHash');

  // Same message for unknown email and wrong password → no account enumeration.
  if (!user || !(await user.checkPassword(data.password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  if (user.status === 'suspended') throw ApiError.forbidden('This account has been suspended. Contact support.');
  user.lastActiveAt = new Date();
  await user.save();
  sendSession(res, user);
});

exports.logout = (req, res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(env.COOKIE_NAME, opts);
  res.json({ success: true, message: 'Logged out' });
};

exports.me = (req, res) => {
  res.json({ success: true, data: { user: req.user.toPrivate() } });
};
