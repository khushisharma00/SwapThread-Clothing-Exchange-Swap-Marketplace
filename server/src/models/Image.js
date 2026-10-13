const mongoose = require('mongoose');

/**
 * Image storage model:
 * Supports Cloudinary free tier cloud storage (production recommended).
 * When Cloudinary is not configured (e.g. local offline dev/tests),
 * falls back to storing data as binary buffer directly in MongoDB.
 */
const imageSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      select: false,
      required: function () {
        return !this.url;
      },
    },
    url: { type: String, default: null },
    cloudinaryId: { type: String, default: null },
    contentType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    generated: { type: Boolean, default: false }, // true for seed illustrations (server-generated SVG)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
