const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const catalog = require('../config/catalog');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody, assertId } = require('../utils/validate');
const { serializeListing } = require('../utils/serialize');
const { toGeoPoint } = require('../utils/geo');

exports.publicProfile = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'user id');
  const user = await User.findById(req.params.id);
  if (!user || user.status !== 'active') throw ApiError.notFound('User not found');
  const listings = await Listing.find({ owner: user._id, status: 'available' }).sort({ createdAt: -1 }).limit(24).populate('owner');
  res.json({
    success: true,
    data: { user: user.toPublic(), listings: listings.map((l) => serializeListing(l)) },
  });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const data = validateBody(
    req.body,
    {
      name: { type: 'string', required: true, min: 2, max: 60, label: 'Name' },
      bio: { type: 'string', max: 300, label: 'Bio' },
      phone: { type: 'string', max: 20, label: 'Phone', pattern: /^[+\d\s()-]{0,20}$/, patternMessage: 'Phone can contain digits, spaces, +, - and brackets only' },
      city: { type: 'enum', values: catalog.cityNames, label: 'City' },
      area: { type: 'string', max: 60, label: 'Area' },
      showArea: { type: 'boolean', label: 'Show area' },
      preferredSizes: { type: 'string', max: 100, label: 'Preferred sizes' },
    },
    { partial: true }
  );
  const user = req.user;
  if (data.name !== undefined) user.name = data.name;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.preferredSizes !== undefined) {
    user.preferredSizes = data.preferredSizes.split(',').map((s) => s.trim()).filter((s) => catalog.SIZES.includes(s));
  }
  if (data.city) {
    const city = catalog.findCity(data.city);
    user.location.city = city.name;
    user.location.state = city.state;
    user.geo = toGeoPoint(city);
  }
  if (data.area !== undefined) user.location.area = data.area;
  if (data.showArea !== undefined) user.location.showArea = data.showArea;
  await user.save();
  res.json({ success: true, data: { user: user.toPrivate() } });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const data = validateBody(req.body, {
    currentPassword: { type: 'string', required: true, max: 200, label: 'Current password' },
    newPassword: { type: 'string', required: true, min: 8, max: 72, label: 'New password', pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, patternMessage: 'Password must contain at least one letter and one number' },
  });
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.checkPassword(data.currentPassword))) throw ApiError.badRequest('Current password is incorrect', { currentPassword: 'Incorrect password' });
  await user.setPassword(data.newPassword);
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

/** Personal dashboard statistics. */
exports.dashboard = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [listingCounts, incomingPending, outgoingPending, accepted, completed, total] = await Promise.all([
    Listing.aggregate([{ $match: { owner: me, status: { $ne: 'removed' } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    SwapRequest.countDocuments({ owner: me, status: 'pending' }),
    SwapRequest.countDocuments({ requester: me, status: 'pending' }),
    SwapRequest.countDocuments({ $or: [{ owner: me }, { requester: me }], status: 'accepted' }),
    SwapRequest.countDocuments({ $or: [{ owner: me }, { requester: me }], status: 'completed' }),
    SwapRequest.countDocuments({ $or: [{ owner: me }, { requester: me }] }),
  ]);
  const byStatus = Object.fromEntries(listingCounts.map((c) => [c._id, c.count]));
  res.json({
    success: true,
    data: {
      user: req.user.toPrivate(),
      stats: {
        totalListings: Object.values(byStatus).reduce((a, b) => a + b, 0),
        availableListings: byStatus.available || 0,
        reservedListings: byStatus.reserved || 0,
        swappedListings: byStatus.swapped || 0,
        incomingPending,
        outgoingPending,
        activeSwaps: accepted,
        completedSwaps: completed,
        totalSwapRequests: total,
        itemsGivenNewLife: completed * 2,
      },
    },
  });
});
