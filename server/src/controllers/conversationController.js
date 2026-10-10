const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody, assertId } = require('../utils/validate');
const { serializeSwap } = require('../utils/serialize');

const CHAT_OPEN_STATUSES = ['pending', 'accepted'];

function serializeMessage(m, viewerId) {
  return {
    id: m._id.toString(),
    kind: m.kind,
    body: m.body,
    sender: m.sender ? { id: m.sender._id ? m.sender._id.toString() : m.sender.toString(), name: m.sender.name } : null,
    mine: !!(m.sender && viewerId && (m.sender._id || m.sender).toString() === viewerId.toString()),
    createdAt: m.createdAt,
  };
}

/** Loads the swap + conversation and enforces participant (or admin read-only) access. */
async function loadForUser(swapId, user, { write = false } = {}) {
  assertId(swapId, 'swap id');
  const swap = await SwapRequest.findById(swapId).populate([
    { path: 'requester' },
    { path: 'owner' },
    { path: 'requestedListing', populate: { path: 'owner' } },
    { path: 'offeredListing', populate: { path: 'owner' } },
  ]);
  if (!swap) throw ApiError.notFound('Swap request not found');
  const isParticipant = swap.requester._id.equals(user._id) || swap.owner._id.equals(user._id);
  if (!isParticipant && !(user.role === 'admin' && !write)) throw ApiError.forbidden('Only the two people in this swap can view this conversation');
  let convo = await Conversation.findOne({ swap: swap._id });
  if (!convo) convo = await Conversation.create({ swap: swap._id, participants: [swap.requester._id, swap.owner._id] });
  return { swap, convo, isParticipant };
}

exports.listConversations = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 }).limit(100);
  const swaps = await SwapRequest.find({ _id: { $in: convos.map((c) => c.swap) } }).populate([
    { path: 'requester' },
    { path: 'owner' },
    { path: 'requestedListing' },
    { path: 'offeredListing' },
  ]);
  const byId = new Map(swaps.map((s) => [s._id.toString(), s]));
  const items = convos
    .filter((c) => byId.has(c.swap.toString()))
    .map((c) => {
      const swap = byId.get(c.swap.toString());
      const s = serializeSwap(swap, req.user._id);
      const other = s.direction === 'outgoing' ? s.owner : s.requester;
      return {
        swapId: s.id,
        status: s.status,
        otherUser: other,
        requestedTitle: s.requestedListing.title,
        offeredTitle: s.offeredListing.title,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        canSend: CHAT_OPEN_STATUSES.includes(s.status),
      };
    });
  res.json({ success: true, data: { items } });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { swap, convo } = await loadForUser(req.params.swapId, req.user);
  const filter = { conversation: convo._id };
  if (req.query.after) {
    const after = new Date(req.query.after);
    if (!Number.isNaN(after.getTime())) filter.createdAt = { $gt: after };
  }
  const messages = await Message.find(filter).sort({ createdAt: 1 }).limit(500).populate('sender', 'name');
  res.json({
    success: true,
    data: {
      swap: serializeSwap(swap, req.user._id),
      canSend: CHAT_OPEN_STATUSES.includes(swap.status) && (swap.requester._id.equals(req.user._id) || swap.owner._id.equals(req.user._id)),
      messages: messages.map((m) => serializeMessage(m, req.user._id)),
    },
  });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { swap, convo } = await loadForUser(req.params.swapId, req.user, { write: true });
  if (!CHAT_OPEN_STATUSES.includes(swap.status)) throw ApiError.conflict(`This swap is ${swap.status}; the conversation is now read-only`);
  const data = validateBody(req.body, { body: { type: 'string', required: true, min: 1, max: 1000, label: 'Message' } });
  const msg = await Message.create({ conversation: convo._id, sender: req.user._id, kind: 'user', body: data.body });
  convo.lastMessageAt = msg.createdAt;
  convo.lastMessagePreview = data.body.slice(0, 120);
  await convo.save();
  await msg.populate('sender', 'name');
  res.status(201).json({ success: true, data: { message: serializeMessage(msg, req.user._id) } });
});
