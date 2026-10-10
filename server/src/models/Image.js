const mongoose = require('mongoose');

/**
 * Images are stored in MongoDB (max 2 MB each) so they persist across
 * deploys on hosts with ephemeral disks (e.g. Render free tier) without
 * needing a separate storage account.
 */
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true, select: false },
    contentType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    generated: { type: Boolean, default: false }, // true for seed illustrations (server-generated SVG)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
