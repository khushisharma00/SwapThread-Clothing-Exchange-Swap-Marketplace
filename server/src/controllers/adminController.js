const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const Report = require('../models/Report');
const Message = require('../models/Message');
const catalog = require('../config/catalog');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody, assertId, escapeRegex } = require('../utils/validate');
const { serializeListing, serializeSwap, categoryLabel } = require('../utils/serialize');
const { closeSwapsForRemovedListing } = require('../services/swapService');

const DAY = 24 * 60 * 60 * 1000;

function pct(n, d) {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}

/** Platform analytics & KPIs (PDF: listings, successful swaps, engagement, conversion, active users). */
exports.stats = asyncHandler(async (req, res) => {
  const since30 = new Date(Date.now() - 30 * DAY);
  const since7 = new Date(Date.now() - 7 * DAY);

  const [
    totalUsers, suspendedUsers, activeUsers30, newUsers7,
    listingByStatus, listingsByCategory, listingsByCity,
    swapByStatus, swaps7, openReports, messages30, usersWithSwap,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: 'customer', status: 'active', lastActiveAt: { $gte: since30 } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: since7 } }),
    Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Listing.aggregate([{ $match: { status: { $ne: 'removed' } } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Listing.aggregate([{ $match: { status: { $ne: 'removed' } } }, { $group: { _id: '$location.city', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    SwapRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    SwapRequest.countDocuments({ createdAt: { $gte: since7 } }),
    Report.countDocuments({ status: 'open' }),
    Message.countDocuments({ kind: 'user', createdAt: { $gte: since30 } }),
    SwapRequest.distinct('requester'),
  ]);

  const ls = Object.fromEntries(listingByStatus.map((x) => [x._id, x.count]));
  const ss = Object.fromEntries(swapByStatus.map((x) => [x._id, x.count]));
  const totalRequests = Object.values(ss).reduce((a, b) => a + b, 0);
  const decided = (ss.accepted || 0) + (ss.completed || 0) + (ss.rejected || 0);

  res.json({
    success: true,
    data: {
      kpis: {
        totalListings: (ls.available || 0) + (ls.reserved || 0) + (ls.swapped || 0),
        availableListings: ls.available || 0,
        successfulSwaps: ss.completed || 0,
        activeUsers30d: activeUsers30,
        totalUsers,
        // Conversion = completed swaps ÷ all swap requests.
        swapConversionRate: pct(ss.completed || 0, totalRequests),
        // Acceptance = (accepted + completed) ÷ requests that were decided (accepted/completed/rejected).
        acceptanceRate: pct((ss.accepted || 0) + (ss.completed || 0), decided),
        // Engagement = share of members who have sent at least one swap request.
        userEngagementRate: pct(usersWithSwap.length, totalUsers),
      },
      users: { total: totalUsers, suspended: suspendedUsers, newLast7d: newUsers7 },
      listings: { byStatus: ls, byCategory: listingsByCategory.map((c) => ({ category: c._id, label: categoryLabel(c._id), count: c.count })), byCity: listingsByCity.map((c) => ({ city: c._id, count: c.count })) },
      swaps: { byStatus: ss, total: totalRequests, last7d: swaps7 },
      reports: { open: openReports },
      messagesLast30d: messages30,
      generatedAt: new Date(),
    },
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) {
    const re = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  if (['active', 'suspended'].includes(req.query.status)) filter.status = req.query.status;
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  const counts = await Listing.aggregate([
    { $match: { owner: { $in: users.map((u) => u._id) }, status: { $ne: 'removed' } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  res.json({
    success: true,
    data: {
      items: users.map((u) => ({
        ...u.toPrivate(),
        suspendedReason: u.suspendedReason,
        lastActiveAt: u.lastActiveAt,
        listingCount: countMap.get(u._id.toString()) || 0,
      })),
    },
  });
});

exports.setUserStatus = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'user id');
  const data = validateBody(req.body, {
    status: { type: 'enum', required: true, values: ['active', 'suspended'], label: 'Status' },
    reason: { type: 'string', max: 300, label: 'Reason' },
  });
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot change your own account status');
  if (user.role === 'admin') throw ApiError.forbidden('Administrator accounts cannot be suspended here');
  user.status = data.status;
  user.suspendedReason = data.status === 'suspended' ? data.reason || 'Violation of community guidelines' : '';
  await user.save();

  if (data.status === 'suspended') {
    // Take the user's open swaps off the table so nobody waits on a suspended member.
    const open = await SwapRequest.find({ active: true, $or: [{ requester: user._id }, { owner: user._id }] });
    for (const s of open) {
      await SwapRequest.updateOne({ _id: s._id, active: true }, { status: 'cancelled', active: false, $push: { history: { status: 'cancelled', by: req.user._id, note: 'Closed by admin: account suspended', at: new Date() } } });
      if (s.status === 'accepted') {
        await Listing.updateMany({ _id: { $in: [s.requestedListing, s.offeredListing] }, status: 'reserved' }, { status: 'available' });
      }
    }
  }
  res.json({ success: true, data: { user: { ...user.toPrivate(), suspendedReason: user.suspendedReason } } });
});

exports.listListings = asyncHandler(async (req, res) => {
  const filter = {};
  if (catalog.LISTING_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) {
    const re = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ title: re }, { brand: re }, { clothingType: re }];
  }
  const items = await Listing.find(filter).sort({ createdAt: -1 }).limit(200).populate('owner');
  res.json({ success: true, data: { items: items.map((l) => serializeListing(l)) } });
});

exports.updateListing = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'listing id');
  const data = validateBody(
    req.body,
    {
      title: { type: 'string', min: 3, max: 80, label: 'Title' },
      description: { type: 'string', min: 10, max: 1000, label: 'Description' },
      category: { type: 'enum', values: catalog.categoryValues, label: 'Category' },
      moderationNote: { type: 'string', max: 300, label: 'Moderation note' },
      status: { type: 'enum', values: ['available', 'removed'], label: 'Status' },
    },
    { partial: true }
  );
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw ApiError.notFound('Listing not found');
  if (data.status === 'available' && listing.status !== 'removed') delete data.status; // only "restore" a removed listing
  Object.assign(listing, data);
  await listing.save();
  if (data.status === 'removed') await closeSwapsForRemovedListing(listing._id, 'the item was removed by a moderator.');
  await listing.populate('owner');
  res.json({ success: true, data: { listing: serializeListing(listing) } });
});

exports.removeListing = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'listing id');
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw ApiError.notFound('Listing not found');
  listing.status = 'removed';
  listing.moderationNote = (typeof req.body?.reason === 'string' && req.body.reason.trim().slice(0, 300)) || 'Removed by moderator';
  await listing.save();
  await closeSwapsForRemovedListing(listing._id, 'the item was removed by a moderator.');
  res.json({ success: true, message: 'Listing removed' });
});

exports.listSwaps = asyncHandler(async (req, res) => {
  const filter = {};
  if (catalog.SWAP_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const items = await SwapRequest.find(filter).sort({ updatedAt: -1 }).limit(200).populate([
    { path: 'requester' }, { path: 'owner' }, { path: 'requestedListing' }, { path: 'offeredListing' },
  ]);
  res.json({ success: true, data: { items: items.map((s) => serializeSwap(s, req.user._id)) } });
});

exports.listReports = asyncHandler(async (req, res) => {
  const filter = {};
  if (['open', 'resolved', 'dismissed'].includes(req.query.status)) filter.status = req.query.status;
  const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(200).populate('reporter', 'name email').populate('resolvedBy', 'name');
  // Attach a short human-readable description of each target.
  const items = await Promise.all(
    reports.map(async (r) => {
      let target = null;
      if (r.targetType === 'listing') {
        const l = await Listing.findById(r.targetId).select('title status');
        target = l ? { label: l.title, status: l.status, link: `/listings/${l._id}` } : null;
      } else if (r.targetType === 'user') {
        const u = await User.findById(r.targetId).select('name status');
        target = u ? { label: u.name, status: u.status, link: `/users/${u._id}` } : null;
      } else {
        const s = await SwapRequest.findById(r.targetId).select('status');
        target = s ? { label: `Swap ${s._id.toString().slice(-6)}`, status: s.status, link: `/chat/${s._id}` } : null;
      }
      return {
        id: r._id.toString(),
        targetType: r.targetType,
        targetId: r.targetId.toString(),
        target,
        reason: r.reason,
        details: r.details,
        status: r.status,
        adminNote: r.adminNote,
        reporter: r.reporter ? { id: r.reporter._id.toString(), name: r.reporter.name, email: r.reporter.email } : null,
        resolvedBy: r.resolvedBy ? r.resolvedBy.name : null,
        resolvedAt: r.resolvedAt,
        createdAt: r.createdAt,
      };
    })
  );
  res.json({ success: true, data: { items } });
});

exports.resolveReport = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'report id');
  const data = validateBody(req.body, {
    status: { type: 'enum', required: true, values: ['resolved', 'dismissed', 'open'], label: 'Status' },
    adminNote: { type: 'string', max: 500, label: 'Admin note' },
  });
  const report = await Report.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found');
  report.status = data.status;
  if (data.adminNote !== undefined) report.adminNote = data.adminNote;
  report.resolvedBy = data.status === 'open' ? undefined : req.user._id;
  report.resolvedAt = data.status === 'open' ? undefined : new Date();
  await report.save();
  res.json({ success: true, data: { report: { id: report._id.toString(), status: report.status, adminNote: report.adminNote } } });
});
