const SwapRequest = require('../models/SwapRequest');
const Listing = require('../models/Listing');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody, assertId } = require('../utils/validate');
const { serializeSwap, serializeListing } = require('../utils/serialize');
const { pointFromGeo, distanceKm } = require('../utils/geo');
const { compareValues } = require('../services/valueCalculator');
const swapService = require('../services/swapService');

const POPULATE = [
  { path: 'requester' },
  { path: 'owner' },
  { path: 'requestedListing', populate: { path: 'owner' } },
  { path: 'offeredListing', populate: { path: 'owner' } },
];

async function loadSerialized(id, viewerId) {
  const swap = await SwapRequest.findById(id).populate(POPULATE);
  return serializeSwap(swap, viewerId);
}

exports.list = asyncHandler(async (req, res) => {
  const box = req.query.box || 'all';
  const me = req.user._id;
  const filter = box === 'incoming' ? { owner: me } : box === 'outgoing' ? { requester: me } : { $or: [{ owner: me }, { requester: me }] };
  if (req.query.status) {
    const statuses = String(req.query.status).split(',').filter((s) => SwapRequest.schema.path('status').enumValues.includes(s));
    if (statuses.length) filter.status = { $in: statuses };
  }
  const swaps = await SwapRequest.find(filter).sort({ updatedAt: -1 }).limit(200).populate(POPULATE);
  res.json({ success: true, data: { items: swaps.map((s) => serializeSwap(s, me)) } });
});

exports.getOne = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'swap id');
  const swap = await SwapRequest.findById(req.params.id).populate(POPULATE);
  if (!swap) throw ApiError.notFound('Swap request not found');
  const me = req.user._id;
  const isParticipant = swap.requester._id.equals(me) || swap.owner._id.equals(me);
  if (!isParticipant && req.user.role !== 'admin') throw ApiError.forbidden('You are not part of this swap');
  res.json({ success: true, data: { swap: serializeSwap(swap, me) } });
});

exports.create = asyncHandler(async (req, res) => {
  const data = validateBody(req.body, {
    requestedListingId: { type: 'string', required: true, label: 'Requested item' },
    offeredListingId: { type: 'string', required: true, label: 'Offered item' },
    message: { type: 'string', max: 500, label: 'Message' },
    exchangeMethod: { type: 'enum', values: ['meetup', 'courier', 'undecided'], label: 'Exchange method' },
  });
  assertId(data.requestedListingId, 'requested item');
  assertId(data.offeredListingId, 'offered item');
  const swap = await swapService.createSwap({ requester: req.user, ...data });
  res.status(201).json({ success: true, data: { swap: await loadSerialized(swap._id, req.user._id) } });
});

function actionHandler(action) {
  return asyncHandler(async (req, res) => {
    assertId(req.params.id, 'swap id');
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
    const swap = await swapService[action](req.params.id, req.user, note);
    res.json({ success: true, data: { swap: await loadSerialized(swap._id, req.user._id) } });
  });
}

exports.accept = actionHandler('acceptSwap');
exports.reject = actionHandler('rejectSwap');
exports.cancel = actionHandler('cancelSwap');
exports.confirm = actionHandler('confirmSwap');

/** Value comparison preview between two listings, computed from stored values. */
exports.compare = asyncHandler(async (req, res) => {
  const { offered, requested } = req.query;
  assertId(String(offered || ''), 'offered item');
  assertId(String(requested || ''), 'requested item');
  const [a, b] = await Promise.all([Listing.findById(offered), Listing.findById(requested)]);
  if (!a || !b || a.status === 'removed' || b.status === 'removed') throw ApiError.notFound('Listing not found');
  res.json({ success: true, data: compareValues(a.estimatedValue, b.estimatedValue) });
});

/** Suggested fair swaps across the whole platform, nearest first. */
exports.suggestions = asyncHandler(async (req, res) => {
  const myItems = await Listing.find({ owner: req.user._id, status: 'available' }).populate('owner');
  if (!myItems.length) return res.json({ success: true, data: { items: [], reason: 'List an item to get swap suggestions.' } });
  const values = myItems.map((m) => m.estimatedValue);
  const minV = Math.min(...values) * 0.75;
  const maxV = Math.max(...values) * 1.25;
  const center = req.user.geo ? pointFromGeo(req.user.geo) : null;
  const candidates = await Listing.find({
    owner: { $ne: req.user._id },
    status: 'available',
    estimatedValue: { $gte: minV, $lte: maxV },
  })
    .populate('owner')
    .limit(300);

  const items = [];
  for (const theirs of candidates) {
    if (!theirs.owner || theirs.owner.status !== 'active') continue;
    let best = null;
    for (const mine of myItems) {
      const cmp = compareValues(mine.estimatedValue, theirs.estimatedValue);
      if (cmp.isFairMatch && (!best || cmp.difference < best.cmp.difference)) best = { mine, cmp };
    }
    if (best) {
      const km = center ? distanceKm(center, pointFromGeo(theirs.geo)) : null;
      items.push({ theirItem: serializeListing(theirs, center), yourItem: serializeListing(best.mine), comparison: best.cmp, km });
    }
  }
  items.sort((x, y) => (x.km ?? 1e9) - (y.km ?? 1e9) || x.comparison.difference - y.comparison.difference);
  res.json({ success: true, data: { items: items.slice(0, 12).map(({ km, ...rest }) => rest) } });
});
