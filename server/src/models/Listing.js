const mongoose = require('mongoose');
const { categoryValues, conditionValues, LISTING_STATUSES, AUDIENCES } = require('../config/catalog');

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    category: { type: String, required: true, enum: categoryValues },
    clothingType: { type: String, required: true, trim: true, maxlength: 40 }, // e.g. "Denim jacket"
    audience: { type: String, enum: AUDIENCES, default: 'unisex' },
    brand: { type: String, required: true, trim: true, maxlength: 40 },
    size: { type: String, required: true, trim: true, maxlength: 12 },
    condition: { type: String, required: true, enum: conditionValues },
    color: { type: String, trim: true, maxlength: 30, default: '' },
    // Server-computed. calculatedValue = formula output; estimatedValue = owner-adjusted (±25% max).
    calculatedValue: { type: Number, required: true, min: 0 },
    estimatedValue: { type: Number, required: true, min: 0, index: true },
    valueBreakdown: { type: Object, default: {} },
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    location: {
      city: { type: String, required: true },
      state: { type: String, default: '' },
    },
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat] — city centroid
    },
    status: { type: String, enum: LISTING_STATUSES, default: 'available', index: true },
    moderationNote: { type: String, maxlength: 300, default: '' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ geo: '2dsphere' });
listingSchema.index({ status: 1, category: 1, createdAt: -1 });
listingSchema.index({ 'location.city': 1, status: 1 });

module.exports = mongoose.model('Listing', listingSchema);
