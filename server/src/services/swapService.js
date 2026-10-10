/**
 * Swap state machine and consistency rules.
 *
 *   pending ──accept──▶ accepted ──both confirm──▶ completed
 *      │                   │
 *      ├─reject─▶ rejected  └─cancel─▶ cancelled (listings released)
 *      └─cancel─▶ cancelled
 *
 * Consistency without multi-document transactions (works on any MongoDB,
 * including a standalone local server and Atlas free tier):
 *  - Every state change is a *conditional* atomic update, e.g.
 *    findOneAndUpdate({ _id, status: 'pending' }, { status: 'accepted' }).
 *    If two requests race, only one matches; the other gets 409.
 *  - Accepting reserves both listings with conditional updates
 *    ({ status: 'available' } → 'reserved'). If any step fails, the steps
 *    already done are rolled back (compensating updates).
 *  - Completing moves listings 'reserved' → 'swapped' only for listings
 *    reserved by this swap.
 */
const SwapRequest = require('../models/SwapRequest');
const Listing = require('../models/Listing');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');
const { compareValues } = require('./valueCalculator');

async function postSystemMessage(swapId, body) {
  const convo = await Conversation.findOne({ swap: swapId });
  if (!convo) return;
  await Message.create({ conversation: convo._id, kind: 'system', body });
  convo.lastMessageAt = new Date();
  convo.lastMessagePreview = body.slice(0, 120);
  await convo.save();
}

function historyEntry(status, by, note = '') {
  return { status, by, note, at: new Date() };
}

async function createSwap({ requester, requestedListingId, offeredListingId, message, exchangeMethod }) {
  if (requestedListingId === offeredListingId) throw ApiError.badRequest('You cannot swap an item for itself');

  const [requested, offered] = await Promise.all([
    Listing.findById(requestedListingId),
    Listing.findById(offeredListingId),
  ]);
  if (!requested || requested.status === 'removed') throw ApiError.notFound('The item you want is no longer listed');
  if (!offered || offered.status === 'removed') throw ApiError.notFound('The item you are offering was not found');

  if (requested.owner.equals(requester._id)) throw ApiError.badRequest('You cannot request a swap for your own item');
  if (!offered.owner.equals(requester._id)) throw ApiError.forbidden('You can only offer items that you own');
  if (requested.status !== 'available') throw ApiError.conflict('This item is not available for swapping right now');
  if (offered.status !== 'available') throw ApiError.conflict('The item you are offering is not available (it may be reserved in another swap)');

  const owner = await User.findById(requested.owner);
  if (!owner || owner.status !== 'active') throw ApiError.conflict('The owner of this item is not accepting swaps right now');

  const duplicate = await SwapRequest.exists({ requester: requester._id, requestedListing: requested._id, active: true });
  if (duplicate) throw ApiError.conflict('You already have an open swap request for this item');

  // Values come from the database, never from the client.
  const cmp = compareValues(offered.estimatedValue, requested.estimatedValue);

  let swap;
  try {
    swap = await SwapRequest.create({
      requester: requester._id,
      owner: requested.owner,
      requestedListing: requested._id,
      offeredListing: offered._id,
      message: message || '',
      exchangeMethod: exchangeMethod || 'undecided',
      offeredValue: cmp.offeredValue,
      requestedValue: cmp.requestedValue,
      valueDifference: cmp.difference,
      isFairMatch: cmp.isFairMatch,
      history: [historyEntry('pending', requester._id, 'Swap requested')],
    });
  } catch (err) {
    if (err && err.code === 11000) throw ApiError.conflict('You already have an open swap request for this item');
    throw err;
  }

  const convo = await Conversation.create({ swap: swap._id, participants: [requester._id, requested.owner] });
  await Message.create({
    conversation: convo._id,
    kind: 'system',
    body: `${requester.name} proposed swapping "${offered.title}" (est. ₹${offered.estimatedValue}) for "${requested.title}" (est. ₹${requested.estimatedValue}).`,
  });
  if (message) {
    await Message.create({ conversation: convo._id, sender: requester._id, kind: 'user', body: message });
  }
  convo.lastMessageAt = new Date();
  convo.lastMessagePreview = (message || 'Swap requested').slice(0, 120);
  await convo.save();

  return swap;
}

/** Cancel every other open swap that involves the given listing ids. */
async function closeConflictingSwaps(listingIds, exceptSwapId, note) {
  const conflicts = await SwapRequest.find({
    _id: { $ne: exceptSwapId },
    active: true,
    $or: [{ requestedListing: { $in: listingIds } }, { offeredListing: { $in: listingIds } }],
  });
  for (const s of conflicts) {
    const updated = await SwapRequest.findOneAndUpdate(
      { _id: s._id, status: { $in: ['pending', 'accepted'] } },
      { status: 'cancelled', active: false, $push: { history: historyEntry('cancelled', null, note) } },
      { new: true }
    );
    if (updated && s.status === 'accepted') {
      await Listing.updateMany(
        { _id: { $in: [s.requestedListing, s.offeredListing], $nin: listingIds }, status: 'reserved' },
        { status: 'available' }
      );
    }
    if (updated) await postSystemMessage(s._id, `This request was closed automatically: ${note}`);
  }
}

async function acceptSwap(swapId, user) {
  const swap = await SwapRequest.findById(swapId);
  if (!swap) throw ApiError.notFound('Swap request not found');
  if (!swap.owner.equals(user._id)) throw ApiError.forbidden('Only the owner of the requested item can accept this swap');
  if (swap.status !== 'pending') throw ApiError.conflict(`This request is already ${swap.status}`);

  // 1. Reserve the requested listing (owned by the accepter).
  const reservedA = await Listing.findOneAndUpdate(
    { _id: swap.requestedListing, owner: swap.owner, status: 'available' },
    { status: 'reserved' },
    { new: true }
  );
  if (!reservedA) throw ApiError.conflict('Your item is no longer available (it may be reserved in another swap)');

  // 2. Reserve the offered listing (owned by the requester).
  const reservedB = await Listing.findOneAndUpdate(
    { _id: swap.offeredListing, owner: swap.requester, status: 'available' },
    { status: 'reserved' },
    { new: true }
  );
  if (!reservedB) {
    await Listing.updateOne({ _id: reservedA._id, status: 'reserved' }, { status: 'available' });
    throw ApiError.conflict('The offered item is no longer available');
  }

  // 3. Move the swap pending → accepted (conditional, race-safe).
  const accepted = await SwapRequest.findOneAndUpdate(
    { _id: swap._id, status: 'pending' },
    { status: 'accepted', $push: { history: historyEntry('accepted', user._id, 'Swap accepted') } },
    { new: true }
  );
  if (!accepted) {
    await Listing.updateMany({ _id: { $in: [reservedA._id, reservedB._id] }, status: 'reserved' }, { status: 'available' });
    throw ApiError.conflict('This request changed while you were accepting it. Please refresh.');
  }

  await closeConflictingSwaps([reservedA._id, reservedB._id], swap._id, 'one of the items was reserved in another accepted swap.');
  await postSystemMessage(swap._id, `${user.name} accepted the swap. Both items are now reserved. Arrange the exchange here, then both of you confirm it.`);
  return accepted;
}

async function rejectSwap(swapId, user, note = '') {
  const swap = await SwapRequest.findById(swapId);
  if (!swap) throw ApiError.notFound('Swap request not found');
  if (!swap.owner.equals(user._id)) throw ApiError.forbidden('Only the owner of the requested item can reject this swap');
  const updated = await SwapRequest.findOneAndUpdate(
    { _id: swap._id, status: 'pending' },
    { status: 'rejected', active: false, $push: { history: historyEntry('rejected', user._id, note || 'Swap declined') } },
    { new: true }
  );
  if (!updated) throw ApiError.conflict(`This request is already ${swap.status}`);
  await postSystemMessage(swap._id, `${user.name} declined the swap.${note ? ` Note: ${note}` : ''}`);
  return updated;
}

async function cancelSwap(swapId, user, note = '') {
  const swap = await SwapRequest.findById(swapId);
  if (!swap) throw ApiError.notFound('Swap request not found');
  const isRequester = swap.requester.equals(user._id);
  const isOwner = swap.owner.equals(user._id);
  if (!isRequester && !isOwner) throw ApiError.forbidden('You are not part of this swap');
  if (swap.status === 'pending' && !isRequester) {
    throw ApiError.badRequest('To decline a pending request, use Reject');
  }
  const updated = await SwapRequest.findOneAndUpdate(
    { _id: swap._id, status: { $in: ['pending', 'accepted'] } },
    { status: 'cancelled', active: false, $push: { history: historyEntry('cancelled', user._id, note || 'Swap cancelled') } },
    { new: true }
  );
  if (!updated) throw ApiError.conflict(`This request is already ${swap.status}`);
  if (swap.status === 'accepted') {
    await Listing.updateMany(
      { _id: { $in: [swap.requestedListing, swap.offeredListing] }, status: 'reserved' },
      { status: 'available' }
    );
  }
  await postSystemMessage(swap._id, `${user.name} cancelled the swap.${note ? ` Note: ${note}` : ''}`);
  return updated;
}

/** Each participant confirms the exchange happened. When both have, the swap completes. */
async function confirmSwap(swapId, user) {
  const swap = await SwapRequest.findById(swapId);
  if (!swap) throw ApiError.notFound('Swap request not found');
  const isRequester = swap.requester.equals(user._id);
  const isOwner = swap.owner.equals(user._id);
  if (!isRequester && !isOwner) throw ApiError.forbidden('You are not part of this swap');
  if (swap.status !== 'accepted') throw ApiError.conflict('Only accepted swaps can be confirmed as exchanged');

  const field = isRequester ? 'requesterConfirmed' : 'ownerConfirmed';
  let updated = await SwapRequest.findOneAndUpdate(
    { _id: swap._id, status: 'accepted' },
    { [field]: true },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This swap changed. Please refresh.');

  if (updated.requesterConfirmed && updated.ownerConfirmed) {
    const completed = await SwapRequest.findOneAndUpdate(
      { _id: swap._id, status: 'accepted', requesterConfirmed: true, ownerConfirmed: true },
      {
        status: 'completed',
        active: false,
        completedAt: new Date(),
        $push: { history: historyEntry('completed', user._id, 'Both people confirmed the exchange') },
      },
      { new: true }
    );
    if (completed) {
      await Listing.updateMany(
        { _id: { $in: [swap.requestedListing, swap.offeredListing] }, status: 'reserved' },
        { status: 'swapped' }
      );
      await User.updateMany({ _id: { $in: [swap.requester, swap.owner] } }, { $inc: { swapsCompleted: 1 } });
      await postSystemMessage(swap._id, 'Swap completed! Thank you for giving clothes a second life. 🌱');
      updated = completed;
    }
  } else {
    await postSystemMessage(swap._id, `${user.name} confirmed the exchange. Waiting for the other person to confirm.`);
  }
  return updated;
}

/** Used when a listing is removed by its owner or an admin. */
async function closeSwapsForRemovedListing(listingId, note) {
  await closeConflictingSwaps([listingId], null, note);
}

module.exports = { createSwap, acceptSwap, rejectSwap, cancelSwap, confirmSwap, closeSwapsForRemovedListing, postSystemMessage };
