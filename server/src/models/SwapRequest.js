const mongoose = require('mongoose');
const { SWAP_STATUSES } = require('../config/catalog');

const ACTIVE_STATUSES = ['pending', 'accepted'];

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: SWAP_STATUSES, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 300, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const swapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    offeredListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    message: { type: String, maxlength: 500, default: '' },
    status: { type: String, enum: SWAP_STATUSES, default: 'pending', index: true },
    // true while pending/accepted — powers the "no duplicate open request" unique index.
    active: { type: Boolean, default: true },
    // Value snapshot taken by the SERVER at request time.
    offeredValue: { type: Number, required: true },
    requestedValue: { type: Number, required: true },
    valueDifference: { type: Number, required: true },
    isFairMatch: { type: Boolean, required: true },
    // Both people confirm the physical exchange happened → completed.
    requesterConfirmed: { type: Boolean, default: false },
    ownerConfirmed: { type: Boolean, default: false },
    exchangeMethod: { type: String, enum: ['meetup', 'courier', 'undecided'], default: 'undecided' },
    history: { type: [historySchema], default: [] },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// One open request per requester per requested item.
swapRequestSchema.index(
  { requester: 1, requestedListing: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

swapRequestSchema.statics.ACTIVE_STATUSES = ACTIVE_STATUSES;

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
