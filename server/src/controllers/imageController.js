const Image = require('../models/Image');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { assertId } = require('../utils/validate');
const { sniffImageType } = require('../middleware/upload');
const { imageUrl } = require('../utils/serialize');

exports.upload = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('Choose at least one image (field name "images")');
  const docs = [];
  for (const f of files) {
    const real = sniffImageType(f.buffer);
    if (!real) throw ApiError.badRequest(`"${f.originalname}" is not a valid JPEG, PNG or WebP image`);
    docs.push({ data: f.buffer, contentType: real, size: f.size, owner: req.user._id });
  }
  const created = await Image.insertMany(docs);
  res.status(201).json({
    success: true,
    data: { images: created.map((img) => ({ id: img._id.toString(), url: imageUrl(img._id) })) },
  });
});

exports.serve = asyncHandler(async (req, res) => {
  assertId(req.params.id, 'image id');
  const img = await Image.findById(req.params.id).select('+data');
  if (!img) throw ApiError.notFound('Image not found');
  res.set('Content-Type', img.contentType);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.set('X-Content-Type-Options', 'nosniff');
  // Even our own generated SVGs are served sandboxed so they can never run scripts.
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.set('Cross-Origin-Resource-Policy', 'same-site');
  res.send(img.data);
});
