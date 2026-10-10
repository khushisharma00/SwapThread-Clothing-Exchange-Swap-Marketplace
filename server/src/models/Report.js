const mongoose = require('mongoose');

const REPORT_REASONS = ['inappropriate', 'misleading', 'counterfeit', 'no_show', 'item_not_as_described', 'harassment', 'spam', 'other'];

/** User reports & swap disputes reviewed by administrators. */
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['listing', 'user', 'swap'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    adminNote: { type: String, maxlength: 500, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.statics.REASONS = REPORT_REASONS;

module.exports = mongoose.model('Report', reportSchema);
