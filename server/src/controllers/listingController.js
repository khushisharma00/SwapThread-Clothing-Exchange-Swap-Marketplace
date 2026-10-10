const Listing = require('../models/Listing');
const Image = require('../models/Image');
const SwapRequest = require('../models/SwapRequest');
const catalog = require('../config/catalog');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody, assertId, escapeRegex } = require('../utils/validate');
const { serializeListing } = require('../utils/serialize');
const { pointFromGeo, toGeoPoint, distanceKm, EARTH_RADIUS_KM } = require('../utils/geo');
const { estimateValue, resolveListingValue, compareValues } = require('../services/valueCalculator');
const { closeSwapsForRemovedListing } = require('../services/swapService');

const LISTING_RULES = {
  title: { type: 'string', required: true, min: 3, max: 80, label: 'Title' },
  description: { type: 'string', required: true, min: 10, max: 1000, label: 'Description' },
  category: { type: 'enum', required: true, values: catalog.categoryValues, label: 'Category' },
  clothingType: { type: 'string', required: true, min: 2, max: 40, label: 'Clothing type' },
  audience: { type: 'enum', values: catalog.AUDIENCES, label: 'Audience' },
  brand: { type: 'string', required: true, min: 1, max: 40, label: 'Brand' },
  size: { type: 'enum', required: true, values: catalog.SIZES, label: 'Size' },
  condition: { type: 'enum', required: true, values: catalog.conditionValues, label: 'Condition' },
  color: { type: 'string', max: 30, label: 'Colour' },
  city: { type: 'enum', values: catalog.cityNames, label: 'City' },
  requestedValue: { type: 'number', min: 0, max: 1000000, label: 'Estimated swap value' },
  images: { type: 'ids', max: 4, label: 'Images' },
};

const MAX_LIMIT = 48;

function viewerPoint(user) {
  return user && user.geo ? pointFromGeo(user.geo) : null;
}

async function assertOwnImages(imageIds, userId) {
  if (!imageIds || !imageIds.length) return;
  const count = await Image.countDocuments({ _id: { $in: imageIds }, owner: userId });
  if (count !== imageIds.length) throw ApiError.badRequest('One or more images are invalid or not yours');
}

exports.meta = (req, res) => {
  res.json({
    success: true,
    data: {
      categories: catalog.CATEGORIES.map(({ value, label, baseValue }) => ({ value, label, baseValue })),
      conditions: catalog.CONDITIONS,
      sizes: catalog.SIZES,
      audiences: catalog.AUDIENCES,
      cities: catalog.CITIES.map(({ name, state }) => ({ name, state })),
      brandTiers: Object.entries(catalog.BRAND_TIERS).map(([tier, t]) => ({ tier, label: t.label, multiplier: t.multiplier, examples: t.brands.slice(0, 6) })),
    },
  });
};

exports.estimate = (req, res) => {
  const data = validateBody(req.body, {
    category: { type: 'enum', required: true, values: catalog.categoryValues, label: 'Category' },
    brand: { type: 'string', max: 40, label: 'Brand' },
    condition: { type: 'enum', required: true, values: catalog.conditionValues, label: 'Condition' },
  });
  const est = estimateValue(data);
  res.json({ success: true, data: { ...est, minValue: Math.round(est.value * 0.75 / 10) * 10, maxValue: Math.round(est.value * 1.25 / 10) * 10 } });
};

exports.list = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = {};

  const statuses = q.includeUnavailable === 'true' ? ['available', 'reserved', 'swapped'] : ['available'];
  filter.status = { $in: statuses };

  if (q.q && String(q.q).trim()) {
    const re = new RegExp(escapeRegex(String(q.q).trim().slice(0, 60)), 'i');
    filter.$or = [{ title: re }, { brand: re }, { clothingType: re }, { color: re }, { description: re }];
  }
  if (q.category && catalog.categoryValues.includes(q.category)) filter.category = q.category;
  if (q.size && catalog.SIZES.includes(q.size)) filter.size = q.size;
  if (q.condition && catalog.conditionValues.includes(q.condition)) filter.condition = q.condition;
  if (q.audience && catalog.AUDIENCES.includes(q.audience)) filter.audience = q.audience;
  if (q.owner) {
    assertId(String(q.owner), 'owner');
    filter.owner = q.owner;
  }
  if (q.excludeMine === 'true' && req.user) filter.owner = { $ne: req.user._id };

  const minV = Number(q.minValue);
  const maxV = Number(q.maxValue);
  if (Number.isFinite(minV) || Number.isFinite(maxV)) {
    filter.estimatedValue = {};
    if (Number.isFinite(minV)) filter.estimatedValue.$gte = minV;
    if (Number.isFinite(maxV)) filter.estimatedValue.$lte = maxV;
  }

  // Location: exact city and/or radius around a city (or the viewer's own city).
  let center = null;
  if (q.city) {
    const city = catalog.findCity(q.city);
    if (!city) throw ApiError.badRequest('Unknown city');
    if (q.radiusKm) center = { lat: city.lat, lng: city.lng };
    else filter['location.city'] = city.name;
  }
  if (q.radiusKm) {
    const radius = Number(q.radiusKm);
    if (!Number.isFinite(radius) || radius <= 0 || radius > 3000) throw ApiError.badRequest('radiusKm must be between 1 and 3000');
    if (!center) center = viewerPoint(req.user);
    if (!center) throw ApiError.badRequest('Choose a city or set your city in your profile to search by distance');
    filter.geo = { $geoWithin: { $centerSphere: [[center.lng, center.lat], radius / EARTH_RADIUS_KM] } };
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(q.limit, 10) || 12));
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const sortKey = q.sort || 'newest';
  const refPoint = center || viewerPoint(req.user);

  let items;
  let total;
  if (sortKey === 'distance' && refPoint) {
    const all = await Listing.find(filter).populate('owner').limit(500);
    all.sort((a, b) => distanceKm(refPoint, pointFromGeo(a.geo)) - distanceKm(refPoint, pointFromGeo(b.geo)));
    total = all.length;
    items = all.slice((page - 1) * limit, page * limit);
  } else {
    const sorts = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      value_asc: { estimatedValue: 1, createdAt: -1 },
      value_desc: { estimatedValue: -1, createdAt: -1 },
    };
    [items, total] = await Promise.all([
      Listing.find(filter).sort(sorts[sortKey] || sorts.newest).skip((page - 1) * limit).limit(limit).populate('owner'),
      Listing.countDocuments(filter),
    ]);
  }

  res.json({
    success: true,
    data: {
      items: items.map((l) => serializeListing(l, refPoint)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

exports.mine = asyncHandler(async (req, res) => {
  const items = await Listing.find({ owner: req.user._id, status: { $ne: 'removed' } }).sort({ createdAt: -1 }).populate('owner');
  res.json({ success: true, data: { items: items.map((l) => serializeListing(l)) } });
});

exports.getOne = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'listing id');
  const listing = await Listing.findById(req.params.id).populate('owner');
  const isOwner = req.user && listing && listing.owner && listing.owner._id.equals(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  if (!listing || (listing.status === 'removed' && !isOwner && !isAdmin)) throw ApiError.notFound('Listing not found');
  if (!isOwner) Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } }).catch(() => {});

  let myOpenRequest = null;
  if (req.user && !isOwner) {
    const open = await SwapRequest.findOne({ requester: req.user._id, requestedListing: listing._id, active: true }).select('_id status');
    if (open) myOpenRequest = { id: open._id.toString(), status: open.status };
  }
  res.json({
    success: true,
    data: { listing: serializeListing(listing, viewerPoint(req.user)), isOwner: !!isOwner, myOpenRequest },
  });
});

/** Compare the viewer's own available items against this listing (fair-match suggestions). */
exports.matches = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'listing id');
  const target = await Listing.findById(req.params.id);
  if (!target || target.status === 'removed') throw ApiError.notFound('Listing not found');
  const mine = await Listing.find({ owner: req.user._id, status: 'available', _id: { $ne: target._id } }).populate('owner');
  const items = mine
    .map((l) => ({ listing: serializeListing(l), comparison: compareValues(l.estimatedValue, target.estimatedValue) }))
    .sort((a, b) => a.comparison.difference - b.comparison.difference);
  res.json({ success: true, data: { targetValue: target.estimatedValue, items } });
});

exports.create = asyncHandler(async (req, res) => {
  const data = validateBody(req.body, LISTING_RULES);
  const city = catalog.findCity(data.city || req.user.location?.city);
  if (!city) throw ApiError.badRequest('Please choose a city (or set your city in your profile)', { city: 'City is required' });
  await assertOwnImages(data.images, req.user._id);

  const est = estimateValue(data);
  const listing = await Listing.create({
    title: data.title,
    description: data.description,
    category: data.category,
    clothingType: data.clothingType,
    audience: data.audience || 'unisex',
    brand: data.brand,
    size: data.size,
    condition: data.condition,
    color: data.color || '',
    calculatedValue: est.value,
    estimatedValue: resolveListingValue(est.value, data.requestedValue),
    valueBreakdown: est.breakdown,
    images: data.images || [],
    owner: req.user._id, // never from the client
    location: { city: city.name, state: city.state },
    geo: toGeoPoint(city),
    status: 'available',
  });
  await listing.populate('owner');
  res.status(201).json({ success: true, data: { listing: serializeListing(listing) } });
});

exports.update = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'listing id');
  const listing = await Listing.findById(req.params.id);
  if (!listing || listing.status === 'removed') throw ApiError.notFound('Listing not found');
  if (!listing.owner.equals(req.user._id)) throw ApiError.forbidden('You can only edit your own listings');
  if (listing.status !== 'available') throw ApiError.conflict(`This item is ${listing.status} and can no longer be edited`);

  const data = validateBody(req.body, LISTING_RULES, { partial: true });
  if (data.images) await assertOwnImages(data.images, req.user._id);

  for (const key of ['title', 'description', 'category', 'clothingType', 'audience', 'brand', 'size', 'condition', 'color', 'images']) {
    if (data[key] !== undefined) listing[key] = data[key];
  }
  if (data.city) {
    const city = catalog.findCity(data.city);
    listing.location = { city: city.name, state: city.state };
    listing.geo = toGeoPoint(city);
  }
  const est = estimateValue(listing);
  listing.calculatedValue = est.value;
  listing.valueBreakdown = est.breakdown;
  const requested = data.requestedValue !== undefined ? data.requestedValue : listing.estimatedValue;
  listing.estimatedValue = resolveListingValue(est.value, requested);

  await listing.save();
  await listing.populate('owner');
  res.json({ success: true, data: { listing: serializeListing(listing) } });
});

exports.remove = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'listing id');
  const listing = await Listing.findById(req.params.id);
  if (!listing || listing.status === 'removed') throw ApiError.notFound('Listing not found');
  if (!listing.owner.equals(req.user._id)) throw ApiError.forbidden('You can only remove your own listings');
  if (listing.status === 'reserved') throw ApiError.conflict('This item is reserved in an accepted swap. Cancel that swap first.');
  if (listing.status === 'swapped') throw ApiError.conflict('Swapped items are kept for your swap history');

  // Soft delete keeps swap history intact; the listing disappears from browse/search.
  listing.status = 'removed';
  await listing.save();
  await closeSwapsForRemovedListing(listing._id, 'the item was removed by its owner.');
  res.json({ success: true, message: 'Listing removed' });
});

/** Location-based matching: nearby items, suggested fair swaps, and nearby members. */
exports.nearby = asyncHandler(async (req, res) => {
  const center = viewerPoint(req.user);
  if (!center) throw ApiError.badRequest('Set your city in your profile to see nearby swaps');
  const radius = Math.min(3000, Math.max(1, Number(req.query.radiusKm) || 50));

  const listings = await Listing.find({
    status: 'available',
    owner: { $ne: req.user._id },
    geo: { $geoWithin: { $centerSphere: [[center.lng, center.lat], radius / EARTH_RADIUS_KM] } },
  })
    .populate('owner')
    .limit(300);

  const withDistance = listings
    .filter((l) => l.owner && l.owner.status === 'active')
    .map((l) => ({ l, km: distanceKm(center, pointFromGeo(l.geo)) }))
    .sort((a, b) => a.km - b.km || b.l.createdAt - a.l.createdAt);

  const myItems = await Listing.find({ owner: req.user._id, status: 'available' });
  const suggestions = [];
  for (const { l } of withDistance) {
    let best = null;
    for (const mine of myItems) {
      const cmp = compareValues(mine.estimatedValue, l.estimatedValue);
      if (cmp.isFairMatch && (!best || cmp.difference < best.cmp.difference)) best = { mine, cmp };
    }
    if (best) {
      suggestions.push({
        theirItem: serializeListing(l, center),
        yourItem: serializeListing(best.mine),
        comparison: best.cmp,
      });
    }
    if (suggestions.length >= 8) break;
  }

  const memberMap = new Map();
  for (const { l, km } of withDistance) {
    const id = l.owner._id.toString();
    if (!memberMap.has(id)) memberMap.set(id, { member: l.owner.toPublic(), itemCount: 0, distanceKm: Math.round(km) });
    memberMap.get(id).itemCount += 1;
  }

  res.json({
    success: true,
    data: {
      center: { city: req.user.location.city, radiusKm: radius },
      items: withDistance.slice(0, 24).map(({ l }) => serializeListing(l, center)),
      totalNearby: withDistance.length,
      suggestions,
      members: [...memberMap.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12),
      note: 'Distances are approximate and measured between city centres to protect privacy.',
    },
  });
});

module.exports.LISTING_RULES = LISTING_RULES;
