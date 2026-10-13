const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

let isConfigured = false;

if (env.CLOUDINARY_URL) {
  cloudinary.config();
  isConfigured = true;
} else if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  isConfigured = true;
}

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from Multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Upload result { secure_url, public_id }
 */
function uploadStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'swapthread',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = {
  isConfigured: () => isConfigured,
  uploadStream,
  cloudinary,
};
