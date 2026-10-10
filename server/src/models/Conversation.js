const mongoose = require('mongoose');

/** One negotiation conversation per swap request, between exactly two users. */
const conversationSchema = new mongoose.Schema(
  {
    swap: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true, unique: true },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: [(v) => v.length === 2, 'A conversation has exactly two participants'],
      index: true,
    },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, maxlength: 120, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
