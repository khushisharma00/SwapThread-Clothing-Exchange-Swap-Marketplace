const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AVATAR_COLORS = ['#2f6b4f', '#8a5a44', '#4f6d7a', '#7a4f6d', '#6b7a2f', '#a0643c', '#3f5e8c'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    suspendedReason: { type: String, maxlength: 300, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    // Private contact detail — only ever returned to the user themselves (and admins).
    phone: { type: String, maxlength: 20, default: '' },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      area: { type: String, maxlength: 60, default: '' }, // neighbourhood, optional
      showArea: { type: Boolean, default: false }, // user consent to show neighbourhood publicly
    },
    // City-centroid point (never a precise position). GeoJSON = [lng, lat].
    geo: {
      type: { type: String, enum: ['Point'], default: undefined },
      coordinates: { type: [Number], default: undefined },
    },
    preferredSizes: { type: [String], default: [] },
    avatarColor: { type: String, default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] },
    swapsCompleted: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ geo: '2dsphere' }, { sparse: true });

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/** Safe public view — no email, phone, precise data or role internals. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    bio: this.bio,
    avatarColor: this.avatarColor,
    location: {
      city: this.location?.city || '',
      state: this.location?.state || '',
      area: this.location?.showArea ? this.location?.area || '' : '',
    },
    swapsCompleted: this.swapsCompleted,
    memberSince: this.createdAt,
    role: this.role === 'admin' ? 'admin' : undefined,
  };
};

/** Full view for the account owner. */
userSchema.methods.toPrivate = function toPrivate() {
  return {
    ...this.toPublic(),
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    preferredSizes: this.preferredSizes,
    location: {
      city: this.location?.city || '',
      state: this.location?.state || '',
      area: this.location?.area || '',
      showArea: !!this.location?.showArea,
    },
  };
};

module.exports = mongoose.model('User', userSchema);
