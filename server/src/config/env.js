const path = require('path');
// Load environment variables from server directory and workspace root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

let JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
if (!JWT_SECRET || JWT_SECRET === 'replace-with-a-long-random-secret') {
  if (isProduction) {
    throw new Error('JWT_SECRET (or SECRET_KEY) must be set to a strong random value in production.');
  }
  JWT_SECRET = 'dev-only-insecure-secret-change-me';
}

function sanitizeMongoUri(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  if (str.startsWith('MONGODB_URI=')) {
    str = str.replace(/^MONGODB_URI=/, '').trim();
  }
  if (str.startsWith('DATABASE_URL=')) {
    str = str.replace(/^DATABASE_URL=/, '').trim();
  }
  // Strip surrounding quotes
  str = str.replace(/^['"]+|['"]+$/g, '').trim();
  // If user pasted host directly without scheme (e.g. user:pass@cluster... or cluster...)
  if (str && !str.startsWith('mongodb://') && !str.startsWith('mongodb+srv://')) {
    if (str.includes('.mongodb.net')) {
      str = 'mongodb+srv://' + str;
    }
  }
  return str;
}

const resolvedMongoUri = sanitizeMongoUri(process.env.MONGODB_URI) || sanitizeMongoUri(process.env.DATABASE_URL) || 'mongodb://127.0.0.1:27017/rewear';

const env = {
  NODE_ENV,
  isProduction,
  isTest,
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: resolvedMongoUri,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGINS: [
    ...(process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN || '').split(','),
    process.env.RENDER_EXTERNAL_URL,
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:5001',
  ]
    .map((o) => (o ? o.trim() : ''))
    .filter(Boolean),
  COOKIE_NAME: 'rewear_token',

  // Cloudinary Cloud Image Storage
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || '',

  // Optional automated admin bootstrap via environment (No hardcoded credentials)
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Platform Administrator',

  // Seed configuration
  SEED_PASSWORD: process.env.SEED_PASSWORD || process.env.SEED_USER_PASSWORD || '',
};

module.exports = env;
