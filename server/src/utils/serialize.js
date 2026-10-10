const { CATEGORIES, CONDITIONS } = require('../config/catalog');
const { distanceKm, pointFromGeo, distanceLabel } = require('./geo');

const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;
const conditionLabel = (v) => CONDITIONS.find((c) => c.value === v)?.label || v;

function imageUrl(id) {
  return `/api/images/${id}`;
}

function idOf(ref) {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
}

function serializeOwner(owner) {
  if (!owner) return null;
  if (typeof owner.toPublic === 'function') return owner.toPublic();
  return { id: idOf(owner) };
}

/**
 * @param listing  Listing document (owner optionally populated)
 * @param viewerPoint {lat,lng} of the viewer's city, used for an approximate distance label
 */
function serializeListing(listing, viewerPoint) {
  if (!listing) return null;
  const point = pointFromGeo(listing.geo);
  const km = viewerPoint && point ? distanceKm(viewerPoint, point) : null;
  return {
    id: listing._id.toString(),
    title: listing.title,
    description: listing.description,
    category: listing.category,
    categoryLabel: categoryLabel(listing.category),
    clothingType: listing.clothingType,
    audience: listing.audience,
    brand: listing.brand,
    size: listing.size,
    condition: listing.condition,
    conditionLabel: conditionLabel(listing.condition),
    color: listing.color,
    estimatedValue: listing.estimatedValue,
    calculatedValue: listing.calculatedValue,
    valueBreakdown: listing.valueBreakdown,
    images: (listing.images || []).map((img) => imageUrl(idOf(img))),
    imageIds: (listing.images || []).map((img) => idOf(img)),
    owner: serializeOwner(listing.owner),
    location: { city: listing.location?.city, state: listing.location?.state },
    distanceKm: km === null ? null : Math.round(km),
    distanceLabel: distanceLabel(km),
    status: listing.status,
    moderationNote: listing.moderationNote || '',
    views: listing.views,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

function serializeSwap(swap, viewerId) {
  if (!swap) return null;
  const requesterId = idOf(swap.requester);
  const ownerId = idOf(swap.owner);
  const viewer = viewerId ? viewerId.toString() : null;
  return {
    id: swap._id.toString(),
    status: swap.status,
    message: swap.message,
    direction: viewer === requesterId ? 'outgoing' : viewer === ownerId ? 'incoming' : 'other',
    requester: serializeOwner(swap.requester),
    owner: serializeOwner(swap.owner),
    requestedListing: swap.requestedListing && swap.requestedListing.title ? serializeListing(swap.requestedListing) : { id: idOf(swap.requestedListing) },
    offeredListing: swap.offeredListing && swap.offeredListing.title ? serializeListing(swap.offeredListing) : { id: idOf(swap.offeredListing) },
    offeredValue: swap.offeredValue,
    requestedValue: swap.requestedValue,
    valueDifference: swap.valueDifference,
    isFairMatch: swap.isFairMatch,
    requesterConfirmed: swap.requesterConfirmed,
    ownerConfirmed: swap.ownerConfirmed,
    exchangeMethod: swap.exchangeMethod,
    history: (swap.history || []).map((h) => ({ status: h.status, by: idOf(h.by), note: h.note, at: h.at })),
    completedAt: swap.completedAt,
    createdAt: swap.createdAt,
    updatedAt: swap.updatedAt,
  };
}

module.exports = { serializeListing, serializeSwap, serializeOwner, imageUrl, idOf, categoryLabel, conditionLabel };
