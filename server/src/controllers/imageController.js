const Image = require('../models/Image');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { assertId } = require('../utils/validate');
const { sniffImageType } = require('../middleware/upload');
const { imageUrl } = require('../utils/serialize');
const cloudinaryService = require('../services/cloudinary');

exports.upload = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('Choose at least one image (field name "images")');
  const docs = [];

  const useCloudinary = cloudinaryService.isConfigured();

  for (const f of files) {
    const real = sniffImageType(f.buffer);
    if (!real) throw ApiError.badRequest(`"${f.originalname}" is not a valid JPEG, PNG or WebP image`);

    let cloudUrl = null;
    let cloudId = null;

    if (useCloudinary) {
      try {
        const uploadResult = await cloudinaryService.uploadStream(f.buffer);
        cloudUrl = uploadResult.secure_url;
        cloudId = uploadResult.public_id;
      } catch (err) {
        console.warn('Cloudinary upload fallback to database storage:', err.message);
      }
    }

    docs.push({
      data: cloudUrl ? undefined : f.buffer,
      url: cloudUrl,
      cloudinaryId: cloudId,
      contentType: real,
      size: f.size,
      owner: req.user._id,
    });
  }

  const created = await Image.insertMany(docs);
  res.status(201).json({
    success: true,
    data: {
      images: created.map((img) => ({
        id: img._id.toString(),
        url: img.url || imageUrl(img._id),
      })),
    },
  });
});

exports.serve = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'image id');
  const img = await Image.findById(req.params.id).select('+data');
  if (!img) throw ApiError.notFound('Image not found');

  // If stored on Cloudinary, redirect to cloud CDN URL
  if (img.url) {
    return res.redirect(302, img.url);
  }

  res.set('Content-Type', img.contentType);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.set('X-Content-Type-Options', 'nosniff');
  // Sandboxed CSP protects SVG/binary responses
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.set('Cross-Origin-Resource-Policy', 'same-site');
  res.send(img.data);
});
